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
const InspectorProxy = require('react-native/local-cli/server/util/inspectorProxy.js');
const webSocketProxy = require('react-native/local-cli/server/util/webSocketProxy.js');
const messageSocket = require('react-native/local-cli/server/util/messageSocket.js');

/**
 * Packager-like Server running on top of Webpack
 */
class Server {
  constructor(compiler, options = {}) {
    const appHandler = new Express();
    const webpackMiddleware = webpackDevMiddleware(compiler, options);
    const httpServer = this.httpServer = http.createServer(appHandler);
    
    const inspectorProxy = new InspectorProxy();
    
    const debuggerProxy = webSocketProxy.attachToServer(httpServer, '/debugger-proxy');
    webSocketProxy.attachToServer(httpServer, '/devtools');
    inspectorProxy.attachToServer(httpServer, '/inspector');
    messageSocket.attachToServer(httpServer, '/message');   

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