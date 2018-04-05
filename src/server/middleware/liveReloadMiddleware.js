/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const removeSlashFromTheEndOfPath = require('../util/removeSlashFromTheEndOfPath');

/**
 * Live reload middleware
 */
function liveReloadMiddleware(compiler) {
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

  return (req, res, next) => {
    const path = removeSlashFromTheEndOfPath(req.path);

    /**
     * React Native client opens connection at `/onchange`
     * and awaits reload signal (http status code - 205)
     */
    if (path === '/onchange') {
      const watcher = { req, res };

      watchers.push(watcher);

      req.on('close', () => {
        watchers.splice(watchers.indexOf(watcher), 1);
      });

      return;
    }

    if (path === '/reloadapp') {
      notifyAllWatchers();
      res.end();
      return;
    }

    /**
     * On new `build`, notify all registered watchers to reload
     */
    compiler.plugin('done', () => {
      notifyAllWatchers();
    });

    next();
  };
}

module.exports = liveReloadMiddleware;
