/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { WebpackStats } from '../types';

const express = require('express');
const http = require('http');
const path = require('path');

type InvalidCallback = (compilingAfterError: boolean) => void;
type CompileCallback = (stats: WebpackStats) => void;

/**
 * Custom made middlewares
 */
const webpackDevMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('./middleware/hotMiddleware');
const devToolsMiddleware = require('./middleware/devToolsMiddleware');
const liveReloadMiddleware = require('./middleware/liveReloadMiddleware');
const statusPageMiddleware = require('./middleware/statusPageMiddleware');
const symbolicateMiddleware = require('./middleware/symbolicateMiddleware');
const openInEditorMiddleware = require('./middleware/openInEditorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const missingBundleMiddleware = require('./middleware/missingBundleMiddleware');
const systraceMiddleware = require('./middleware/systraceMiddleware');
const rawBodyMiddleware = require('./middleware/rawBodyMiddleware');
const requestChangeMiddleware = require('./middleware/requestChangeMiddleware');
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
function createServer(
  compiler: any,
  onInvalid: InvalidCallback,
  onCompile: CompileCallback
) {
  const appHandler = express();
  const webpackMiddleware = webpackDevMiddleware(compiler, {
    lazy: false,
    noInfo: true,
    reporter: null,
    /**
     * Quiet the default errors, we will handle error by our own
     */
    quiet: true,
    stats: 'errors-only',
    hot: true,
    mimeTypes: { 'application/javascript': ['bundle'] },
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
    },
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000,
    },
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
    .use(symbolicateMiddleware(compiler))
    .use(openInEditorMiddleware())
    .use('/systrace', systraceMiddleware)
    .use(loggerMiddleware)
    .use(requestChangeMiddleware)
    .use(webpackMiddleware)
    .use(missingBundleMiddleware);

  // Handle callbacks
  let didHaveIssues = false;
  compiler.plugin('done', (stats: WebpackStats) => {
    const hasIssues = stats.hasErrors() || stats.hasWarnings();

    if (hasIssues) {
      didHaveIssues = true;
    } else {
      didHaveIssues = false;
    }

    onCompile(stats);
  });

  compiler.plugin('invalid', () => {
    onInvalid(didHaveIssues);
  });

  return httpServer;
}

module.exports = createServer;
