/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

require('@babel/register')({
  // Use a PNPM-compatible search pattern for node_modules.
  ignore: [/node_modules(?!.*[/\\]haul)/],
  retainLines: true,
  sourceMaps: 'inline',
  babelrc: false,
  configFile: false,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: 'entry',
        corejs: 2,
      },
    ],
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-flow-strip-types'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
  ],
});
require('@babel/polyfill');

/**
 * Get env vars
 */
const {
  HAUL_PLATFORM,
  HAUL_OPTIONS,
  HAUL_DIRECTORY,
  HAUL_SOCKET_ADDRESS,
} = process.env;

if (
  !HAUL_PLATFORM ||
  !HAUL_OPTIONS ||
  HAUL_OPTIONS.length <= 2 ||
  !HAUL_DIRECTORY ||
  !HAUL_SOCKET_ADDRESS
) {
  throw new Error('Unable to create worker due to missing env variables');
}

require('./initWorker')({
  platform: HAUL_PLATFORM,
  options: HAUL_OPTIONS,
  socketAddress: HAUL_SOCKET_ADDRESS,
});
