/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * makeReactNativeConfig.js
 */
const webpack = require("webpack");
const path = require("path");
const findProvidesModule = require("./findProvidesModule");

const PLATFORMS = ["ios", "android"];

const PATH_TO_POLYFILLS = require.resolve("./polyfillEnvironment.js");

/**
 * Returns default config based on environment 
 */
const getDefaultConfig = ({ platform, dev, port }) => ({
  // Platform we are building for
  platform: platform,
  // Built-in loaders
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: "babel-loader",
        options: {
          presets: ["react-native"]
        }
      },
      { test: /\.json$/, loader: "json-loader" }
    ]
  },
  output: {
    path: "/",
    filename: `${platform}.bundle`
  },
  // Default plugins
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: dev
    })
  ],
  // Default resolve
  resolve: {
    alias: findProvidesModule([
      path.resolve(process.cwd(), "node_modules/react-native")
    ]),
    extensions: ["", `.${platform}.js`, ".js"]
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
function makeReactNativeConfig(func, options) {
  return PLATFORMS.map(platform => {
    const env = Object.assign({}, options, { platform });
    const defaultConfig = getDefaultConfig(env);

    // @todo validate etc.
    const userConfig = func(defaultConfig);
    userConfig.entry = [PATH_TO_POLYFILLS, userConfig.entry];

    return userConfig;
  });
}

module.exports = makeReactNativeConfig;
