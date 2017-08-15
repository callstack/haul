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
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

const AssetResolver = require('../resolvers/AssetResolver');
const HasteResolver = require('../resolvers/HasteResolver');
const moduleResolve = require('../utils/resolveModule');

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
const getDefaultConfig = ({
  platform,
  root,
  dev,
  minify,
  bundle,
  port,
}): WebpackConfig => ({
  context: root,
  entry: [
    /**
     * Polyfills we include for latest JS features
     * It is also needed to setup the required environment
     */
    require.resolve('./polyfillEnvironment.js'),
  ],
  /**
   * `cheap-module-source-map` is faster than `source-map`,
   * but it doesn't have column mappings
   */
  devtool: dev ? 'cheap-module-source-map' : 'source-map',
  output: {
    path: path.join(root, 'dist'),
    filename: `index.${platform}.bundle`,
    publicPath: `http://localhost:${port}/`,
  },
  module: {
    rules: [
      /**
       * This is a non-standard feature
       * And, it won't work coz we don't have DOM
       */
      { parser: { requireEnsure: false } },
      {
        test: /\.js$/,
        /**
         * The React Native ecosystem publishes untranspiled modules
         * We transpile modules prefixed with react for compatibility
         */
        exclude: /node_modules\/(?!react|@expo|pretty-format|haul)/,
        use: {
          loader: require.resolve('happypack/loader'),
          query: { id: 'babel' },
        },
      },
      {
        test: AssetResolver.test,
        use: {
          /**
           * Asset loader enables asset management based on image scale
           * This needs the AssetResolver plugin in resolver.plugins to work
           */
          loader: require.resolve('../loaders/assetLoader'),
          query: { platform, root, bundle },
        },
      },
    ],
  },
  plugins: [
    /**
     * MacOS has a case insensitive filesystem
     * This is needed so we can error on incorrect case
     */
    new CaseSensitivePathsPlugin(),
    new ProgressBarPlugin({
      format: `[:bar] :percent`,
      summary: false,
    }),
    new webpack.DefinePlugin({
      /**
       * Various libraries like React rely on `process.env.NODE_ENV`
       * to distinguish between production and development
       */
      'process.env': {
        NODE_ENV: dev ? '"development"' : '"production"',
        DEV_SERVER_ORIGIN: JSON.stringify(`http://localhost:${port}`),
      },
      __DEV__: dev,
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: !!minify,
      debug: dev,
    }),
    new webpack.NamedModulesPlugin(),
    /**
     * By default, sourcemaps are only generated with *.js files
     * We need to use the plugin to configure *.bundle to emit sourcemap
     */
    new webpack.SourceMapDevToolPlugin({
      test: /\.(js|css|bundle)($|\?)/i,
      filename: '[file].map',
    }),
    /**
     * HappyPack runs transforms in parallel to improve build performance
     */
    new HappyPack({
      id: 'babel',
      loaders: [
        {
          path: require.resolve('babel-loader'),
          query: Object.assign({}, getBabelConfig(root), {
            /**
             * This enables caching results in ./node_modules/.cache/babel-loader/
             * to improve the rebuild speeds
             * This is a feature of `babel-loader` and not babel
             */
            cacheDirectory: dev,
          }),
        },
      ],
      verbose: false,
    }),
  ]
    .concat(
      process.env.NODE_ENV === 'production'
        ? []
        : new webpack.HotModuleReplacementPlugin(),
    )
    .concat(
      minify
        ? [
            new webpack.optimize.UglifyJsPlugin({
              /**
             * By default, uglify only minifies *.js files
             * We need to use the plugin to configutr *.bundle to get minified
             * Also disable IE8 support as we don't need it'
             */
              test: /\.(js|bundle)($|\?)/i,
              sourceMap: true,
              compress: {
                screw_ie8: true,
                warnings: false,
              },
              mangle: {
                screw_ie8: true,
              },
              output: {
                comments: false,
                screw_ie8: true,
              },
            }),
          ]
        : [],
    ),
  resolve: {
    plugins: [
      /**
       * React Native uses a module system called Haste
       * We don't support it, but need to provide a compatibility layer
       */
      new HasteResolver({
        directories: [moduleResolve(root, 'react-native')],
      }),
      /**
       * This is required by asset loader to resolve extra scales
       * It will resolve assets like image@1x.png when image.png is not present
       */
      new AssetResolver({ platform }),
    ],
    /**
     * Match what React Native packager supports
     * First entry takes precendece
     */
    mainFields: ['react-native', 'browser', 'main'],
    extensions: [`.${platform}.js`, '.native.js', '.js'],
  },
  /**
   * Set target to webworker as it's closer to RN environment than `web`.
   */
  target: 'webworker',
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
