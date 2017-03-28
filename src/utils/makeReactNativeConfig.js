/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * makeReactNativeConfig.js
 *
 * @flow
 */
const webpack = require('webpack');
const HappyPack = require('happypack');
const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const assetResolver = require('../resolvers/AssetResolver');
const findProvidesModule = require('./findProvidesModule');

const PLATFORMS = ['ios', 'android'];

type ConfigOptions = {
  cwd: string,
  dev: boolean,
};

type WebpackPlugin = {
  apply: (typeof webpack) => void,
};

type WebpackConfig = {
  entry: Array<string>,
  output: {
    path: string,
    filename: string,
  },
  plugins: Array<WebpackPlugin>,
};

type WebpackConfigFactory =
  | ((ConfigOptions, WebpackConfig) => WebpackConfig)
  | WebpackConfig;

/**
 * Returns default config based on environment
 */
const getDefaultConfig = ({ platform, cwd, dev }): WebpackConfig => ({
  // Default polyfills and entry-point setup
  entry: [require.resolve('./polyfillEnvironment.js')],
  devtool: 'source-map',
  output: {
    path: `${cwd}/dist`,
    filename: `index.${platform}.bundle`,
  },
  // Built-in loaders
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!react)/,
        use: {
          loader: require.resolve('happypack/loader'),
          query: { id: 'babel' },
        },
      },
      {
        test: assetResolver.test,
        use: {
          loader: require.resolve('../loaders/assetLoader'),
          query: { platform },
        },
      },
    ],
  },
  // Default plugins
  plugins: [
    new ProgressBarPlugin({
      format: `[:bar] :percent`,
      summary: false,
    }),
    new webpack.DefinePlugin({
      __DEV__: dev,
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: !dev,
      debug: dev,
    }),
    new webpack.NamedModulesPlugin(),
    // The default configuration only generates sourcemap with *.js
    new webpack.SourceMapDevToolPlugin({
      test: /\.(js|css|bundle)($|\?)/i,
    }),
    // Use HappyPack to speed up Babel build times
    // significantly
    new HappyPack({
      id: 'babel',
      loaders: [
        `${require.resolve('babel-loader')}?presets[]=react-native&plugins[]=${require.resolve('./fixRequireIssues')}`,
      ],
      verbose: false,
    }),
  ],
  // Default resolve
  resolve: {
    plugins: [assetResolver({ platform })],
    alias: findProvidesModule([path.resolve(cwd, 'node_modules/react-native')]),
    mainFields: ['browser', 'main'],
    extensions: [`.${platform}.js`, '.native.js', '.js'],
  },
});

/**
 * Creates an array of configs based on changing `env` for every
 * platform and returns
 */
function makeReactNativeConfig(
  userWebpackConfig: WebpackConfigFactory,
  options: ConfigOptions,
): [Array<WebpackConfig>, typeof PLATFORMS] {
  const configs = PLATFORMS.map(platform => {
    const env = Object.assign({}, options, { platform });
    const defaultWebpackConfig = getDefaultConfig(env);

    const config = Object.assign(
      {},
      defaultWebpackConfig,
      typeof userWebpackConfig === 'function'
        ? userWebpackConfig(env, defaultWebpackConfig)
        : userWebpackConfig,
    );

    // For simplicity, we don't require users to extend
    // default config.entry but do it for them.
    config.entry = defaultWebpackConfig.entry.concat(config.entry);

    return config;
  });

  return [configs, PLATFORMS];
}

module.exports = makeReactNativeConfig;
