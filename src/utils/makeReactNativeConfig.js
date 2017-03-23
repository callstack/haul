/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * makeReactNativeConfig.js
 */
const webpack = require("webpack");
const HappyPack = require("happypack");
const path = require("path");
const findProvidesModule = require("./findProvidesModule");

const PLATFORMS = ["ios", "android"];

/**
 * Returns default config based on environment 
 */
const getDefaultConfig = ({ platform, dev, port }) => ({
  // Platform we are building for
  platform: platform,
  // Default polyfills and entry-point setup
  entry: [
    require.resolve("./polyfillEnvironment.js"),
  ],
  // Built-in loaders
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "happypack/loader?id=babel"
      },
      { test: /\.json$/, loader: "json-loader" }
    ]
  },
  output: {
    path: "/",
    filename: `index.${platform}.bundle`
  },
  // Default plugins
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: dev
    }),
    // Use HappyPack to speed up Babel build times
    // significantly
    new HappyPack({
      id: "babel",
      loaders: [
        `babel-loader?presets[]=react-native&plugins[]=${require.resolve("./fixRequireIssues")}`
      ]
    })
  ],
  // Default resolve
  resolve: {
    alias: findProvidesModule([
      path.resolve(process.cwd(), "node_modules/react-native")
    ]),
    extensions: [`.${platform}.js`, ".js"]
  },
  // Default devServer settings
  devServer: {
    port,
    quiet: true,
    noInfo: true,
    lazy: true,
    filename: `[name].bundle`,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: "/",
    stats: { colors: true }
  }
});

/**
 * Creates an array of configs based on changing `env` for every
 * platform and returns
 */
function makeReactNativeConfig(userWebpackConfig, options) {
  const configs = PLATFORMS.map(platform => {
    const env = Object.assign({}, options, { platform });
    const defaultConfig = getDefaultConfig(env);

    const config = Object.assign(
      {},
      defaultConfig,
      typeof userWebpackConfig === "function"
        ? userWebpackConfig(defaultConfig)
        : userWebpackConfig
    );
    
    // For simplicity, we don't require users to extend
    // default config.entry but do it for them.
    config.entry = defaultConfig.entry.concat(config.entry);
    
    // Platform is extraneous part of Webpack config that we pass to 
    // configure variants. With Webpack 2.x, it has to be removed
    // before setting up compiler
    delete config.platform;

    return config;
  });

  // @todo solve performance when returning many
  return configs[PLATFORMS.indexOf(options.platform)];
}

module.exports = makeReactNativeConfig;
