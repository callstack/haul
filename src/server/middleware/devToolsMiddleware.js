/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const fs = require('fs');
const path = require('path');
const opn = require('opn');

/**
 * Returns name of Chrome app to launch based on the platform
 */
const getChromeAppName = () => {
  switch (process.platform) {
    case 'darwin':
      return 'google chrome';
    case 'win32':
      return 'chrome';
    default:
      return 'google-chrome';
  }
};

/**
 * Launches given `url` in Chrome
 */
const launchChrome = url => {
  opn(url, { app: getChromeAppName() }, err => {
    console.error('Google Chrome exited with error', err);
  });
};

/**
 * Devtools middleware compatible with default React Native implementation
 */
function devToolsMiddleware(debuggerProxy) {
  return (req, res, next) => {
    const port = req.app.get('port');

    switch (req.url) {
      /**
       * Request for the debugger frontend
       */
      case '/debugger-ui': {
        const readStream = fs.createReadStream(
          path.join(__dirname, '../assets/debugger.html'),
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
          path.join(__dirname, '../assets/debuggerWorker.js'),
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
          launchChrome('http://localhost:8081/debugger-ui');
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
