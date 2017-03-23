/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const Express = require("express");
const http = require("http");

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
class Server {
  constructor(compiler) {
    const appHandler = new Express();
    const webpackMiddleware = webpackDevMiddleware(compiler, {
      lazy: false,
      noInfo: true,
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
      },
      publicPath: "/",
      stats: { colors: true }
    });

    this.httpServer = http.createServer(appHandler);

    const debuggerProxy = new WebSocketProxy(
      this.httpServer,
      "/debugger-proxy"
    );

    // Middlewares
    appHandler
      .use(devToolsMiddleware(debuggerProxy))
      .use(liveReloadMiddleware(compiler))
      .use(statusPageMiddleware)
      .use(webpackMiddleware);
  }

  /**
   * Starts listening to incoming requests
   */
  listen(...args) {
    return this.httpServer.listen(...args);
  }
}

module.exports = Server;
