/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const Express = require("express");
const webpackDevMiddleware = require("webpack-dev-middleware");
const http = require('http');

/**
 * Packager-like Server running on top of Webpack
 */
class Server {
  constructor(compiler, options = {}) {
    const appHandler = new Express();
    const webpackMiddleware = webpackDevMiddleware(compiler, options);
    const httpServer = this.httpServer = http.createServer(appHandler);

    appHandler.use(webpackMiddleware);
  }

  /**
   * Starts listening to incoming requests
   */
  listen(...args) {
    return this.httpServer.listen(...args);
  }
}

module.exports = Server;