/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { $Request, $Response } from 'express';
import logger from '../../logger';

const Compiler = require('../../compiler/Compiler');

/**
 * Live reload middleware
 */
function liveReloadMiddleware(compiler: Compiler) {
  let watchers = [];
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
  };

  function notifyAllWatchers() {
    watchers.forEach(watcher => {
      watcher.res.writeHead(205, headers);
      watcher.res.end(JSON.stringify({ changed: true }));
    });

    watchers = [];
  }

  compiler.on(Compiler.Events.BUILD_FINISHED, () => {
    notifyAllWatchers();
  });

  return (req: $Request, res: $Response, next: Function) => {
    /**
     * React Native client opens connection at `/onchange`
     * and awaits reload signal (http status code - 205)
     */

    if (req.path === '/onchange') {
      const watcher = { req, res };

      watchers.push(watcher);

      req.on('close', () => {
        watchers.splice(watchers.indexOf(watcher), 1);
      });

      return;
    }

    if (req.path === '/reloadapp') {
      logger.info(
        'Attempt to reload the app, make sure you have enabled Live Reloading!'
      );
      notifyAllWatchers();
      res.end();
      return;
    }

    next();
  };
}

module.exports = liveReloadMiddleware;
