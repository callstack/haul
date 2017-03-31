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

const AssetResolver = require('../resolvers/AssetResolver');
const HasteResolver = require('../resolvers/HasteResolver');

const getBabelConfig = require('./getBabelConfig');

const PLATFORMS = ['ios', 'android'];

type ConfigOptions = {
  root: string,
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
const getDefaultConfig = (
  { platform, root, dev, minify, bundle },
): WebpackConfig => ({
  // Default polyfills and entry-point setup
  context: root,
  entry: [require.resolve('./polyfillEnvironment.js')],
  devtool: 'source-map',
  output: {
    path: path.join(root, 'dist'),
    filename: `index.${platform}.bundle`,
  },
  // Built-in loaders
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!react|@expo|haul)/,
        use: {
          loader: require.resolve('happypack/loader'),
          query: { id: 'babel' },
        },
      },
      {
        test: AssetResolver.test,
        use: {
          loader: require.resolve('../loaders/assetLoader'),
          query: { platform, root, bundle },
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
      'process.env': { NODE_ENV: dev ? '"development"' : '"production"' },
      __DEV__: dev,
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: !!minify,
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
        {
          path: require.resolve('babel-loader'),
          query: getBabelConfig(root),
        },
      ],
      verbose: false,
    }),
  ].concat(
    minify
      ? [
          new webpack.optimize.UglifyJsPlugin({
            test: /\.(js|bundle)($|\?)/i,
            sourceMap: true,
          }),
        ]
      : [],
  ),
  // Default resolve
  resolve: {
    plugins: [
      new HasteResolver({
        directories: [path.resolve(root, 'node_modules/react-native')],
      }),
      new AssetResolver({ platform }),
    ],
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
