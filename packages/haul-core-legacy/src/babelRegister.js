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
