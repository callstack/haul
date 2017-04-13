/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { $Request, $Response } from 'express';

const fs = require('fs');
const path = require('path');
const opn = require('opn');
const babel = require('babel-core');

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
function devToolsMiddleware(
  debuggerProxy: { isDebuggerConnected: () => boolean },
) {
  return (req: $Request, res: $Response, next: Function) => {
    switch (req.path) {
      /**
       * Request for the debugger frontend (HTML)
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
      case '/debugger-ui.js':
        fs.readFile(
          path.join(__dirname, '../assets/debugger.js'),
          (err, content) => {
            if (err) {
              res.sendStatus(500);
              res.end();
              throw err;
            } else {
              res.writeHead(200, { 'Content-Type': 'application/javascript' });
              res.end(babel.transform(content.toString()).code);
            }
          },
        );
        break;

      /**
       * Request for the debugger worker
       */
      case '/debugger.worker.js':
        fs.readFile(
          path.join(__dirname, '../assets/debugger.worker.js'),
          (err, content) => {
            if (err) {
              res.sendStatus(500);
              res.end();
              throw err;
            } else {
              res.writeHead(200, { 'Content-Type': 'application/javascript' });
              res.end(babel.transform(content.toString()).code);
            }
          },
        );
        break;

      /**
       * Request for (maybe) launching devtools
       */
      case '/launch-js-devtools': {
        if (!debuggerProxy.isDebuggerConnected()) {
          launchChrome(`http://localhost:${req.socket.localPort}/debugger-ui`);
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
