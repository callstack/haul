/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * makeReactNativeConfig.js
 */
const webpack = require("webpack");
const path = require("path");
const findProvidesModule = require("./findProvidesModule");

/**
 * Default array of platforms
 */
const platforms = ["ios", "android", "windows"];

/**
 * Environment to use for bundling
 */
const dev = true;

/**
 * Default entry point
 */
const entry = "index";

/**
 * Settings passed to Webpack to create platform-specific settings
 */
const defaultSettings = {
  platforms,
  dev,
  entry
};

function makeReactNativeConfig(func) {
  const configs = platforms.map(platform => {
    const settings = Object.assign({}, defaultSettings, { platform });
    return attachDefaults(func(settings), settings);
  });

  // @todo figure out how to handle multiple configs
  // best is to create a map of webpack compilers and dev middleware for each platform,
  // than, based on platform=VALUE from URL request, decide which one to load
  return configs[0];
}

/**
 * Attaches common settings for Webpack config to work.
 */
function attachDefaults(config, settings) {
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      __DEV__: settings.dev
    })
  ]);

  config.resolve = Object.assign(
    {},
    {
      alias: findProvidesModule([
        path.resolve(process.cwd(), "node_modules/react-native")
      ]),
      extensions: ["", `.${settings.platform}.js`, ".js"]
    },
    config.resolve || {}
  );

  // Changing `devServer` is not supported
  // Too tightly coupled with React Native for now
  config.devServer = {
    port: 8081,
    quiet: true,
    noInfo: true,
    lazy: true,
    filename: `[name].${settings.platform}.bundle`,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: "/",
    stats: { colors: true }
  };

  // `Output` of bundler is opaque
  config.output = {
    filename: `[name].${settings.platform}.bundle`,
    path: "/",
    publicPath: "/"
  };

  // Entry point
  config.entry = {
    index: [require.resolve("./polyfillEnvironment.js"), ...config.entry.index]
  };

  config.module = Object.assign(
    {},
    {
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
    config.module
  );

  return config;
}

module.exports = makeReactNativeConfig;
