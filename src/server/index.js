/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const Express = require("express");
const http = require('http');

/**
 * Custom made middlewares
 */
const webpackDevMiddleware = require('webpack-dev-middleware');
const devToolsMiddleware = require('./middleware/devToolsMiddleware');

/**
 * Temporarily loaded from React Native to get debugger running. Soon to be replaced.
 */
const webSocketProxy = require('react-native/local-cli/server/util/webSocketProxy.js');

/**
 * Packager-like Server running on top of Webpack
 */
class Server {
  constructor(compiler, options = {}) {
    const appHandler = new Express();
    const webpackMiddleware = webpackDevMiddleware(compiler, options);
    const httpServer = this.httpServer = http.createServer(appHandler);
    
    const debuggerProxy = webSocketProxy.attachToServer(httpServer, '/debugger-proxy');

    appHandler
      .use(devToolsMiddleware(debuggerProxy))
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