/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import {
  sortBundlesByDependencies,
  getNormalizedProjectConfigBuilder,
  Runtime,
} from '@haul-bundler/core';

const EventEmitter = require('events');
const webpack = require('webpack');

const Events = require('../events');

module.exports = async function runWebpackCompiler({
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

  const projectConfig = getNormalizedProjectConfigBuilder(configPath)(runtime, {
    ...configOptions,
    platform,
  });

  const apps = [];
  const bundles = sortBundlesByDependencies(projectConfig);
  let totalProgress = 0;
  let bundlesBuilt = 0;

  for (const bundleName of bundles) {
    let config = projectConfig.webpackConfigs[bundleName];
    /**
     * Let's add ProgressPlugin, but let's be sure that we don't mutate the user's config
     */
    let lastLocalProgress = 0;
    config = {
      ...config,
      plugins: [
        ...config.plugins,
        new webpack.ProgressPlugin(localProgress => {
          if (lastLocalProgress !== localProgress) {
            totalProgress = (bundlesBuilt + localProgress) / bundles.length;
            if (localProgress === 1) {
              bundlesBuilt++;
            }
            emitter.emit(Events.BUILD_PROGRESS, { progress: totalProgress });
            lastLocalProgress = localProgress;
          }
        }),
      ],
    };

    if (projectConfig.bundles[bundleName].dll) {
      await new Promise((resolve, reject) =>
        webpack(config).run(err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      );
    } else {
      apps.push(config);
    }
  }

  const compiler = webpack(apps);

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

  compiler.hooks.invalid.intercept({
    tap() {
      emitter.emit(Events.BUILD_START);
    },
  });

  emitter.on('start', () => {
    emitter.emit(Events.BUILD_START);
    compiler.watch({}, error => {
      if (error) {
        emitter.emit(Events.BUILD_FAILED, { message: error.toString() });
      }
    });
  });

  return emitter;
};
