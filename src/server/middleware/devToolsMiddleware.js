/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const fs = require('fs');
const path = require('path');
const opn = require('opn');
const select = require('platform-select');
const logger = require('../../logger');

/**
 * Launches given `url` in browser based on platform
 */
const launchBrowser = url => {
  const open = app => () => opn(url, { app });

  /**
   * Run Chrome (Chrome Canary) or supported platform.
   * In case of macOS, we can eventually fallback to Safari.
   *
   * select(attemp1, attemp2, attemp3,...) // attempt to run is from left to right
   */
  select(
    {
      // try to find & run Google Chrome
      darwin: open('google chrome'),
      win32: open('chrome'),
      _: open('google-chrome'),
    },
    {
      // On macOS let's try to find & run Canary
      darwin: open('google chrome canary'),
    },
    {
      // No Canary / Chrome, let's run Safari
      darwin: open('safari'),
    }
  ).catch(e => {
    console.log(e); // print error to artifacts
    logger.warn(
      `Cannot start browser for debugging. Navigate manually to "${url}"`
    );
  });
};

/**
 * Devtools middleware compatible with default React Native implementation
 */
function devToolsMiddleware(debuggerProxy) {
  return (req, res, next) => {
    switch (req.cleanPath) {
      /**
       * Request for the debugger frontend
       */
      case '/debugger-ui': {
        const readStream = fs.createReadStream(
          path.join(__dirname, '../assets/debugger.html')
        );
        res.writeHead(200, { 'Content-Type': 'text/html' });
        readStream.pipe(res);
        break;
      }

      /**
       * Request for the debugger worker
       */
      case '/debuggerWorker.js': {
        const readStream = fs.createReadStream(
          path.join(__dirname, '../assets/debuggerWorker.js')
        );
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        readStream.pipe(res);
        break;
      }

      /**
       * Request for (maybe) launching devtools
       */
      case '/launch-js-devtools': {
        if (!debuggerProxy.isDebuggerConnected()) {
          launchBrowser(`http://localhost:${req.socket.localPort}/debugger-ui`);
        }
        res.end('OK');
        break;
      }

      default:
        next();
    }
  };
}

module.exports = devToolsMiddleware;
