/* eslint-disable no-param-reassign, no-debugger, no-empty */

const path = require('path');

module.exports = function Shared(context) {
  const shared = {
    compilerDone(stats) {
      context.state = true;
      context.webpackStats = stats;

      if (!context.state) return;
      const cbs = context.callbacks;
      context.callbacks = [];
      cbs.forEach(cb => {
        cb(stats);
      });

      if (context.forceRebuild) {
        context.forceRebuild = false;
        shared.rebuild();
      }
    },

    compilerInvalid(...args) {
      context.state = false;
      // resolve async
      if (args.length === 2 && typeof args[1] === 'function') {
        const callback = args[1];
        callback();
      }
    },

    ready(fn) {
      if (context.state) {
        return fn(context.webpackStats);
      }

      return context.callbacks.push(fn);
    },

    startWatch() {
      const { compiler } = context;
      context.watching = compiler.watch({}, shared.handleCompilerCb);
    },

    rebuild() {
      if (context.state) {
        context.state = false;
        context.compiler.run(context.handleCompilerCb);
      } else {
        context.forceRebuild = true;
      }
    },

    handleCompilerCb(err) {
      if (err) {
        context.onError(err);
      }
    },

    waitUntilValid(cb = () => {}) {
      if (context.watching) {
        shared.ready(cb);
        context.watching.invalidate();
      }
    },

    invalidate(cb = () => {}) {
      if (context.watching) {
        shared.ready(cb);
        context.watching.invalidate();
      } else {
        cb();
      }
    },

    close(cb = () => {}) {
      if (context.watching) {
        context.watching.close(cb);
      } else {
        cb();
      }
    },

    handleRequest(filename, requestProcess) {
      const pathToFile = path.join(process.cwd(), filename);
      try {
        if (context.fs.statSync(pathToFile).isFile()) {
          // requestProcess();
        }
      } catch (e) {}

      shared.ready(requestProcess);
    },
  };

  context.compiler.plugin('done', shared.compilerDone);
  context.compiler.plugin('invalid', shared.compilerInvalid);
  context.compiler.plugin('watch-run', shared.compilerInvalid);
  context.compiler.plugin('run', shared.compilerInvalid);
  shared.startWatch();

  return shared;
};
