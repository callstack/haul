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
  getBundleFilename,
} from '@haul-bundler/core';
import fs from 'fs';
import path from 'path';
import cpx from 'cpx';

const EventEmitter = require('events');
const webpack = require('webpack');

const Events = require('../events');

module.exports = async function runWebpackCompiler({
  platform,
  options,
}: {
  [key: string]: any,
}) {
  const emitter = new EventEmitter();
  const { configPath, configOptions } = JSON.parse(options);

  const runtime = new Runtime();
  runtime.logger.proxy((level, ...args) => {
    setImmediate(() => {
      emitter.emit(Events.LOG, {
        message: runtime.logger.stringify(args).join(' '),
        level,
      });
    });
  });

  const outputPath = configOptions.assetsDest;
  const projectConfig = getNormalizedProjectConfigBuilder(runtime, configPath)(
    runtime,
    {
      ...configOptions,
      platform,
    }
  );

  const apps = [];
  const bundles = sortBundlesByDependencies(projectConfig, {
    skipHostCheck: configOptions.skipHostCheck,
  });
  let totalProgress = 0;
  let bundlesBuilt = 0;

  for (const bundleName of bundles) {
    const bundleConfig = projectConfig.bundles[bundleName];
    if (bundleConfig.external) {
      const bundleFilename = getBundleFilename(
        {
          ...configOptions,
          platform,
        },
        projectConfig.templates,
        bundleConfig
      );

      try {
        fs.copyFileSync(
          bundleConfig.external.bundlePath,
          path.join(outputPath, bundleFilename)
        );
        runtime.logger.done(
          `Copied external${
            bundleConfig.dll ? ' DLL' : ''
          } bundle "${bundleName}"`
        );
      } catch (error) {
        // Log original message
        runtime.logger.error(error.message);
        let message = '';
        try {
          // If the error was caused due to insufficient permissions,
          // try to get the permissions bits in octal.
          let permissions = '';
          if (error.code === 'EACCES' && error.path) {
            const stats = fs.statSync(error.path);
            permissions = '0' + (stats.mode & parseInt('777', 8)).toString(8);
          }

          message = `Failed to copy${
            bundleConfig.dll ? ' DLL' : ''
          } bundle "${bundleName}": ${error.code} ${error.path}${
            permissions ? ` | permissions: ${permissions}` : ''
          }`;
        } catch (statError) {
          // `fs.statSync` will fail only if the one of the parent directories is inaccessible due
          // to insufficient permissions. If the file does not exists, `fs.statSync` won't be called on it.
          message =
            'Failed to stats file for permissions - parent directories can be inaccessible due to insufficient permissions';
        }

        setTimeout(() => {
          // Emit event only after the emitter is returned from this function.
          emitter.emit(Events.BUILD_FAILED, {
            message,
          });
        }, 0);
        break;
      }

      try {
        if (fs.existsSync(`${bundleConfig.external.bundlePath}.map`)) {
          fs.copyFileSync(
            `${bundleConfig.external.bundlePath}.map`,
            path.join(
              outputPath,
              `${path.basename(bundleConfig.external.bundlePath)}.map`
            )
          );
          runtime.logger.done(`Copied external source maps for ${bundleName}`);
        }
      } catch (error) {
        const message = `Failed to copy source maps for ${bundleName}`;
        runtime.logger.error(message, error.message);
      }

      try {
        cpx.copySync(
          path.join(bundleConfig.external.assetsPath, '**'),
          path.join(outputPath, 'assets'),
          {
            preserve: true,
          }
        );
        runtime.logger.done(
          `Copied assets for external${
            bundleConfig.dll ? ' DLL' : ''
          } bundle "${bundleName}"`
        );
      } catch (error) {
        const message = `Failed to copy assets for ${bundleName}`;
        runtime.logger.error(message, error.message);
      }

      continue;
    }

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
