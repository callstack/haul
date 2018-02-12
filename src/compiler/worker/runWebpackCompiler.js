/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const EventEmitter = require('events');
const webpack = require('webpack');

const getConfig = global.requireWithRootDir('./getConfig');
const Events = global.requireWithRootDir('../events');

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
  const config = getConfig(configPath, configOptions, platform);

  const compiler = webpack(config);
  // Use memory fs
  compiler.outputFileSystem = fs;

  compiler.plugin('done', stats => {
    emitter.emit(Events.BUILD_FINISHED, {
      error: stats.hasErrors() ? stats.errors : null,
      stats,
    });
  });

  compiler.plugin('invalid', (...args) => {
    emitter.emit(Events.BUILD_START);
    resolveAsync(args);
  });
  // compiler.plugin('watch-run', (...args) => {
  //   emitter.emit(Events.BUILD_START);
  //   resolveAsync(args);
  // });
  // compiler.plugin('run', (...args) => {
  //   emitter.emit(Events.BUILD_START);
  //   resolveAsync(args);
  // });

  compiler.watch({}, () => {});

  return emitter;
};

function resolveAsync(args) {
  if (args.length === 2 && typeof args[1] === 'function') {
    const callback = args[1];
    callback();
  }
}
