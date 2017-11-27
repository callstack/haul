/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Live reload middleware
 */
function liveReloadMiddleware() {
  // let watchers = [];
  // const headers = {
  //   'Content-Type': 'application/json; charset=UTF-8',
  // };

  // function notifyAllWatchers() {
  //   watchers.forEach(watcher => {
  //     watcher.res.writeHead(205, headers);
  //     watcher.res.end(JSON.stringify({ changed: true }));
  //   });

  //   watchers = [];
  // }

  return (req, res, next) => {
    /**
     * React Native client opens connection at `/onchange`
     * and awaits reload signal (http status code - 205)
     */
    if (req.path === '/onchange') {
      return res.end(); // Remove once done dev.
      // const watcher = { req, res };

      // watchers.push(watcher);

      // req.on('close', () => {
      //   watchers.splice(watchers.indexOf(watcher), 1);
      // });
    }

    if (req.path === '/reloadapp') {
      return res.end(); // Remove once done dev.
      // notifyAllWatchers();
      // res.end();
    }

    /**
     * On new `build`, notify all registered watchers to reload
     */
    // disable for now
    // compiler.plugin('done', () => {
    //   notifyAllWatchers();
    // });

    next();
  };
}

module.exports = liveReloadMiddleware;
