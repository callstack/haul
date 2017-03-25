/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { WebpackStats } from "../types";

const Express = require("express");
const http = require("http");
const morgan = require("morgan");

type InvalidCallback = (compilingAfterError: boolean) => void;
type CompileCallback = (stats: WebpackStats) => void;

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

morgan.token("path", req => req.path);

/**
 * Packager-like Server running on top of Webpack
 */
function createServer(
  compiler: any,
  onInvalid: InvalidCallback,
  onCompile: CompileCallback
) {
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
    .use(
      morgan(":method :path :status :res[content-length] - :response-time ms")
    )
    .use(webpackMiddleware);

  // Handle callbacks
  let didHaveIssues = false;
  compiler.plugin("done", (stats: WebpackStats) => {
    const hasIssues = stats.hasErrors() || stats.hasWarnings();

    if (hasIssues) {
      didHaveIssues = true;
    } else {
      didHaveIssues = false;
    }

    onCompile(stats);
  });

  compiler.plugin("invalid", () => {
    onInvalid(didHaveIssues);
  });

  return httpServer;
}

module.exports = createServer;
