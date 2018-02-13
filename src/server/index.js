/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const express = require('express');
const http = require('http');
const path = require('path');
// const clear = require('clear');

const Compiler = require('../compiler/Compiler');
const logger = require('../logger');
// const updateProgressBar = require('../utils/haulProgressBar');
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
// const loggerMiddleware = require('./middleware/loggerMiddleware');
const missingBundleMiddleware = require('./middleware/missingBundleMiddleware');
const systraceMiddleware = require('./middleware/systraceMiddleware');
const rawBodyMiddleware = require('./middleware/rawBodyMiddleware');
const requestChangeMiddleware = require('./middleware/requestChangeMiddleware');

const WebSocketServer = require('ws').Server;

/**
 * Temporarily loaded from React Native to get debugger running. Soon to be replaced.
 */
const webSocketProxy = require('./util/websocketProxy');
const WebSocketDebuggerProxy = require('./util/WebsocketDebuggerProxy');

/**
 * Packager-like Server running on top of Webpack
 */
function createServer(config: { configPath: string, configOptions: Object }) {
  const appHandler = express();
  // const webpackMiddleware = webpackDevMiddleware(compiler, {
  //   lazy: false,
  //   noInfo: true,
  //   reporter: null,
  //   /**
  //    * Quiet the default errors, we will handle error by our own
  //    */
  //   quiet: true,
  //   stats: 'errors-only',
  //   hot: true,
  //   mimeTypes: { 'application/javascript': ['bundle'] },
  //   headers: {
  //     'Content-Type': 'application/javascript',
  //     'Access-Control-Allow-Origin': '*',
  //   },
  //   watchOptions: {
  //     aggregateTimeout: 300,
  //     poll: 1000,
  //   },
  // });

  const { configPath, configOptions } = config;

  const compiler = new Compiler(logger, {
    configPath,
    configOptions,
  });

  // compiler.on(Compiler.Events.BUILD_PROGRESS, ({ progress, platform }) => {
  //   updateProgressBar(platform, progress);
  // });

  // compiler.on(Compiler.Events.BUILD_FINISHED, () => {
  //   clear();
  // });

  const loggerMiddleware = initUI(compiler, configOptions);

  process.on('uncaughtException', err => {
    compiler.terminate(err);
  });

  process.on('SIGINT', () => {
    compiler.terminate();
  });

  process.on('SIGTERM', () => {
    compiler.terminate();
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
    .use(requestChangeMiddleware)
    .use(compilerMiddleware)
    .use(missingBundleMiddleware);

  return httpServer;
}

module.exports = createServer;
