/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const EventEmitter = require('events');
const webpack = require('webpack');
const getConfig = require('../../utils/getConfig');
const Events = require('../events');

module.exports = function runWebpackCompiler({
  platform,
  options,
  fs,
}: {
  [key: string]: string,
  fs: Object,
}) {
  const emitter = new EventEmitter();

  const { configPath, configOptions } = JSON.parse(options);

  /**
   * Proxy based on Logger.js 
   */
  const loggerProxy = new Proxy(
    {},
    {
      get: function get(object, logger) {
        return new Proxy(() => {}, {
          apply: (target, that, [message]) => {
            setImmediate(() => emitter.emit(Events.LOG, { message, logger }));
          },
        });
      },
    }
  );

  const config = getConfig(configPath, configOptions, platform, loggerProxy);

  let lastPercent = -1;
  config.plugins.push(
    new webpack.ProgressPlugin(percent => {
      const newPercent = percent.toFixed(2);
      if (newPercent !== lastPercent) {
        lastPercent = newPercent;
        emitter.emit(Events.BUILD_PROGRESS, { progress: newPercent });
      }
    })
  );

  const compiler = webpack(config);
  // Use memory fs
  compiler.outputFileSystem = fs;

  compiler.plugin('done', stats => {
    emitter.emit(Events.BUILD_FINISHED, {
      stats,
    });
  });

  compiler.plugin('invalid', (...args) => {
    emitter.emit(Events.BUILD_START);
    resolveAsync(args);
  });

  emitter.on('start', () => {
    compiler.watch({}, () => {});
    emitter.emit(Events.BUILD_START);
  });

  return emitter;
};

function resolveAsync(args) {
  if (args.length === 2 && typeof args[1] === 'function') {
    const callback = args[1];
    callback();
  }
}
