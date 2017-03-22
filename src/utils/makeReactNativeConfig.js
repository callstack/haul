/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * makeReactNativeConfig.js
 */
const webpack = require("webpack");
const path = require("path");
const findProvidesModule = require("./findProvidesModule");

const PLATFORMS = ["ios", "android", "windows"];

/**
 * Returns default config based on environment 
 */
const getDefaultConfig = ({ platform, dev, port }) => ({
  // Platform we are building for
  platform: platform,
  // Entry point with polyfills
  entry: require.resolve("./polyfillEnvironment.js"),
  // Built-in loaders
  loaders: [
    {
      test: /\.js?$/,
      loader: "babel-loader",
      options: {
        presets: ["react-native"]
      }
    },
    { test: /\.json$/, loader: "json-loader" }
  ],
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
    filename: `[name].${platform}.bundle`,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: "/",
    stats: { colors: true }
  }
});

function makeReactNativeConfig(func, env) {
  const configs = PLATFORMS.map(platform => {
    const defaultConfig = getDefaultConfig(env);
    return func(defaultConfig);
  });

  // @todo handle all the platforms later
  return configs[0];
}

module.exports = makeReactNativeConfig;
