/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const webpack = require("webpack");
const Server = require("../../server");
const path = require("path");

const makeReactNativeConfig = require("../../utils/makeReactNativeConfig");

/**
 * Starts development server
 */
function start() {
  const configs = makeReactNativeConfig(
    require(path.join(process.cwd(), "webpack.config.js")),
    // @todo make these command options and think what else support
    {
      port: 8081,
      dev: false,
    }
  );

  // @todo handle all platforms available
  const compiler = webpack(configs[0]);

  const app = new Server(compiler);
  app.listen(8081, "127.0.0.1", () => {
    console.log("Starting server on http://localhost:8081");
  });
}

module.exports = start;
