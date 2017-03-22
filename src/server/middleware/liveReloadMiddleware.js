/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Live reload middleware
 */
function liveReloadMiddleware(compiler) {
  let watchers = [];

  return (req, res, next) => {
    
    /**
     * React Native client opens connection at `/onchange`
     * and awaits reload signal (http status code - 205)
     */
    if (req.url === '/onchange') {
      console.log('Registered watcher');
      const watcher = { req, res };
      
      watchers.push(watcher);

      req.on('close', () => {
        watchers.splice(watchers.indexOf(watcher), 1);
      });

      return;
    }

    /**
     * On new `build`, notify all registered watchers to reload
     */
    compiler.plugin("done", () => {
      console.log('Reloading');

      const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
      };

      watchers.forEach(({ res }) => {
        res.writeHead(205, headers);
        res.end(JSON.stringify({changed: true}));
      });

      watchers = [];
    });

    next();
  };
}

module.exports = liveReloadMiddleware;