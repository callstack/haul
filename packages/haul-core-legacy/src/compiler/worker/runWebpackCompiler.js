/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import {
  getProjectConfig,
  getWebpackConfig,
  Runtime,
} from '@haul-bundler/core';

const EventEmitter = require('events');
const webpack = require('webpack');

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

  const runtime = new Runtime();
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
  runtime.logger = loggerProxy;

  const projectConfig = getProjectConfig(configPath);
  const config = getWebpackConfig(
    runtime,
    { ...configOptions, platform },
    projectConfig
  );

  let lastPercent = -1;

  /**
   * Let's add ProgressPlugin, but let's be sure that we don't mutate the user's config
   */
  const compiler = webpack({
    ...config,
    plugins: [
      ...config.plugins,
      new webpack.ProgressPlugin(percent => {
        const newPercent = percent.toFixed(2);
        if (newPercent !== lastPercent) {
          lastPercent = newPercent;
          emitter.emit(Events.BUILD_PROGRESS, { progress: newPercent });
        }
      }),
    ],
  });

  // As of Webpack 4.12.0, |outputFileSystem| must be set since there is no
  // fallback despite the documentation stating otherwise.
  compiler.outputFileSystem = fs;

  compiler.hooks.done.intercept({
    call(stats) {
      emitter.emit(Events.BUILD_FINISHED, {
        stats,
      });
    },
  });

  compiler.hooks.failed.intercept({
    call: message => {
      console.log(message); // save whole error with stack trace into artifacts
      emitter.emit(Events.BUILD_FAILED, { message: message.toString() });
    },
  });

  compiler.hooks.invalid.intercept({
    tap() {
      emitter.emit(Events.BUILD_START);
    },
  });

  emitter.on('start', () => {
    compiler.watch({}, () => {});
    emitter.emit(Events.BUILD_START);
  });

  return emitter;
};
