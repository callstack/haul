/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const path = require('path');
const fs = require('fs');

const { MessageError } = require('../errors');
const messages = require('../messages');
const makeReactNativeConfig = require('../utils/makeReactNativeConfig');
const webpack = require('webpack');

/**
 * Bundles your application code
 */
function bundle(argv: Array<string>, opts: *) {
  const directory = process.cwd();
  const configPath = path.join(directory, 'webpack.haul.js');

  if (!opts.platform) {
    throw new MessageError(messages.bundleOptionPlatformMissing());
  }

  if (!fs.existsSync(configPath)) {
    throw new MessageError(
      messages.webpackConfigNotFound({
        directory,
      }),
    );
  }

  // eslint-disable-next-line prefer-const
  let [config, platforms] = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      dev: opts.dev,
      cwd: process.cwd(),
    },
  );

  if (!platforms.includes(opts.platform)) {
    throw new MessageError(messages.bundleOptionPlatformInvalid());
  }

  config = config[platforms.indexOf(opts.platform)];

  // if (opts.bundleOutput) {
  //   config.output = Object.assign({}, config.output, {
  //     path: path.basename(opts.bundleOutput),
  //     filename: path.dirname(opts.bundleOutput),
  //   });
  // }

  const compiler = webpack(config[platforms.indexOf(opts.platform)]);

  compiler.run(() => {
    console.log('Compiled');
  });
}

module.exports = {
  name: 'bundle',
  description: '',
  action: bundle,
  options: [
    {
      name: '--dev [true|false]',
      description: 'Whether to build in development mode',
      default: true,
      parse: (val: string) => JSON.parse(val),
    },
    {
      name: '--platform <ios|android>',
      description: 'Platform to bundle for',
      // }, {
      //   name: '--bundle-output [string]',
      //   description: 'File name where to store the bundle, eg. /tmp/index.ios.bundle',
      // }, {
      //   name: '--sourcemap-output [string]',
      //   description: 'File name where to store the sourcemaps, eg. /tmp/groups.map',
      // }, {
      //   name: '--assets-dest [string]',
      //   description: 'Directory name where to store assets, eg. /tmp/assets',
    },
  ],
};
