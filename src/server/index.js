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
const devToolsMiddleware = require('./middleware/devToolsMiddleware');
const liveReloadMiddleware = require('./middleware/liveReloadMiddleware');
const statusPageMiddleware = require('./middleware/statusPageMiddleware');
const symbolicateMiddleware = require('./middleware/symbolicateMiddleware');
const openInEditorMiddleware = require('./middleware/openInEditorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const missingBundleMiddleware = require('./middleware/missingBundleMiddleware');
const systraceMiddleware = require('./middleware/systraceMiddleware');
const rawBodyMiddleware = require('./middleware/rawBodyMiddleware');

/**
 * Temporarily loaded from React Native to get debugger running. Soon to be replaced.
 */
const WebSocketProxy = require('./util/WebsocketProxy.js');

/**
 * Packager-like Server running on top of Webpack
 */
function createServer(
  compiler: any,
  onInvalid: InvalidCallback,
  onCompile: CompileCallback,
) {
  const appHandler = express();
  const webpackMiddleware = webpackDevMiddleware(compiler, {
    lazy: false,
    noInfo: true,
    reporter: null,
    stats: 'errors-only',
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000,
    },
  });

  const httpServer = http.createServer(appHandler);

  const debuggerProxy = new WebSocketProxy(httpServer, '/debugger-proxy');

  // Middlewares
  appHandler
    .use(express.static(path.join(__dirname, '/assets/public')))
    .use(rawBodyMiddleware)
    .use(devToolsMiddleware(debuggerProxy))
    .use(liveReloadMiddleware(compiler))
    .use(statusPageMiddleware)
    .use(symbolicateMiddleware(compiler))
    .use(openInEditorMiddleware())
    .use('/systrace', systraceMiddleware)
    .use(loggerMiddleware)
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
