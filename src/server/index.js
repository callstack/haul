/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const express = require('express');
const http = require('http');
const path = require('path');

const Compiler = require('../compiler/Compiler');
const initUI = require('./ui');

/**
 * Custom made middlewares
 */

const createCompilerMiddleware = require('./middleware/compilerMiddleware.js');
const hotMiddleware = require('./middleware/hotMiddleware');
const devToolsMiddleware = require('./middleware/devToolsMiddleware');
const liveReloadMiddleware = require('./middleware/liveReloadMiddleware');
const statusPageMiddleware = require('./middleware/statusPageMiddleware');
const symbolicateMiddleware = require('./middleware/symbolicateMiddleware');
const openInEditorMiddleware = require('./middleware/openInEditorMiddleware');
const missingBundleMiddleware = require('./middleware/missingBundleMiddleware');
const systraceMiddleware = require('./middleware/systraceMiddleware');
const rawBodyMiddleware = require('./middleware/rawBodyMiddleware');
const cleanPathMiddleware = require('./middleware/cleanPathMiddleware');

const WebSocketServer = require('ws').Server;

/**
 * Temporarily loaded from React Native to get debugger running. Soon to be replaced.
 */
const webSocketProxy = require('./util/websocketProxy');
const WebSocketDebuggerProxy = require('./util/WebsocketDebuggerProxy');

/**
 * Packager-like Server running on top of Webpack
 */
function createServer(config: { configPath: ?string, configOptions: Object }) {
  const appHandler = express();
  appHandler.disable('etag');

  const { configPath, configOptions } = config;

  const compiler = new Compiler({
    configPath,
    configOptions,
  });

  const loggerMiddleware = initUI(compiler, configOptions);

  process.on('uncaughtException', err => {
    compiler.terminate();
    throw err;
  });

  process.on('SIGINT', () => {
    compiler.terminate();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    compiler.terminate();
    process.exit(2);
  });

  const compilerMiddleware = createCompilerMiddleware(compiler, {
    configPath,
    configOptions,
  });

  const httpServer = http.createServer(appHandler);

  const webSocketServer = new WebSocketServer({ server: httpServer });
  const debuggerProxy = new WebSocketDebuggerProxy(
    webSocketProxy(webSocketServer, '/debugger-proxy')
  );

  hotMiddleware(compiler, {
    nativeProxy: webSocketProxy(webSocketServer, '/hot'),
    haulProxy: webSocketProxy(webSocketServer, '/haul-hmr'),
  });

  // Middlewares
  appHandler
    .use(express.static(path.join(__dirname, '/assets/public')))
    .use(rawBodyMiddleware)
    .use(cleanPathMiddleware)
    .use(devToolsMiddleware(debuggerProxy))
    .use(liveReloadMiddleware(compiler))
    .use(statusPageMiddleware)
    .use(
      symbolicateMiddleware(compiler, {
        configPath,
        configOptions,
      })
    )
    .use(openInEditorMiddleware())
    .use('/systrace', systraceMiddleware)
    .use(loggerMiddleware)
    .use(compilerMiddleware)
    .use(missingBundleMiddleware);

  return httpServer;
}

module.exports = createServer;
