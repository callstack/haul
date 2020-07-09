/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import {
  Configuration,
  Runtime,
  BundleOutputPlugin,
  ExternalBundle,
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
  const configuration = Configuration.getLoader(
    runtime,
    process.cwd(),
    configPath
  ).load({
    ...configOptions,
    platform,
  });

  const apps = [];
  const bundles = configuration.createBundlesSorted(runtime, {
    skipHostCheck: configOptions.skipHostCheck,
  });
  let totalProgress = 0;
  let bundlesBuilt = 0;

  for (const bundle of bundles) {
    if (bundle instanceof ExternalBundle) {
      const bundleFilename = new BundleOutputPlugin({
        mode: configOptions.dev ? 'dev' : 'prod',
        platform,
        bundlingMode: 'multi-bundle',
        bundleName: bundle.name,
        bundleType: bundle.properties.type,
        templatesConfig: configuration.templates,
      }).compileFilenameTemplate();

      try {
        fs.copyFileSync(
          bundle.properties.bundlePath,
          path.join(outputPath, bundleFilename)
        );
        runtime.logger.done(
          `Copied external ${bundle.properties.type} bundle "${bundle.name}"`
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

          message = `Failed to copy ${bundle.properties.type} bundle "${
            bundle.name
          }": ${error.code} ${error.path}${
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
        if (fs.existsSync(`${bundle.properties.bundlePath}.map`)) {
          fs.copyFileSync(
            `${bundle.properties.bundlePath}.map`,
            path.join(
              outputPath,
              `${path.basename(bundle.properties.bundlePath)}.map`
            )
          );
          runtime.logger.done(`Copied external source maps for ${bundle.name}`);
        }
      } catch (error) {
        const message = `Failed to copy source maps for ${bundle.name}`;
        runtime.logger.error(message, error.message);
      }

      try {
        cpx.copySync(
          path.join(bundle.properties.assetsPath, '**'),
          path.join(outputPath, 'assets'),
          {
            preserve: true,
          }
        );
        runtime.logger.done(
          `Copied assets for external${bundle.properties.type} bundle "${bundle.name}"`
        );
      } catch (error) {
        const message = `Failed to copy assets for ${bundle.name}`;
        runtime.logger.error(message, error.message);
      }

      continue;
    }

    let config = bundle.makeWebpackConfig(runtime);

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

    if (bundle.properties.type === 'dll') {
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
