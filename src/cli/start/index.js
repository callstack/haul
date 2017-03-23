/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const webpack = require("webpack");
const Server = require("../../server");
const path = require("path");

const makeReactNativeConfig = require("../../utils/makeReactNativeConfig");

/**
 * Starts development server
 */
function start() {
  const config = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(path.join(process.cwd(), "webpack.config.js")),
    {
      port: 8081,
      dev: true,
      platform: "ios"
    }
  );

  const compiler = new webpack(config);

  const app = new Server(compiler);
  app.listen(8081, "127.0.0.1", () => {
    console.log("Starting server on http://localhost:8081");
  });
}

module.exports = {
  name: "start",
  description: "Starts a new webpack server",
  action: start
};
