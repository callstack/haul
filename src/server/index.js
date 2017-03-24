/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const Express = require("express");
const http = require("http");
const logger = require("../logger");

/**
 * Custom made middlewares
 */
const webpackDevMiddleware = require("webpack-dev-middleware");
const devToolsMiddleware = require("./middleware/devToolsMiddleware");
const liveReloadMiddleware = require("./middleware/liveReloadMiddleware");
const statusPageMiddleware = require("./middleware/statusPageMiddleware");

/**
 * Temporarily loaded from React Native to get debugger running. Soon to be replaced.
 */
const WebSocketProxy = require("./util/webSocketProxy.js");

/**
 * Packager-like Server running on top of Webpack
 */
function createServer(compiler: any, onStart: Function, onRecompile: Function) {
  const appHandler = new Express();
  const webpackMiddleware = webpackDevMiddleware(compiler, {
    lazy: false,
    noInfo: true,
    reporter: () => {},
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  });

  const httpServer = http.createServer(appHandler);

  const debuggerProxy = new WebSocketProxy(httpServer, "/debugger-proxy");

  // Middlewares
  appHandler
    .use(devToolsMiddleware(debuggerProxy))
    .use(liveReloadMiddleware(compiler))
    .use(statusPageMiddleware)
    .use(webpackMiddleware);

  // Handle callbacks
  let firstCompile = true;
  compiler.plugin("done", stats => {
    if (firstCompile) {
      onStart(stats);
    } else {
      onRecompile(stats);
    }
    firstCompile = false;
  });

  return httpServer;
}

module.exports = createServer;
