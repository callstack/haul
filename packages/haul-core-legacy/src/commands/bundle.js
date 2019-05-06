/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';
import {
  getProjectConfigPath,
  getProjectConfig,
  getWebpackConfig,
  Runtime,
  DEFAULT_CONFIG_FILENAME,
} from '@haul/core';

const path = require('path');
const webpack = require('webpack');
const clear = require('clear');
const { MessageError } = require('../errors');
const messages = require('../messages');
const logger = require('../logger');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');

/**
 * Bundles your application code
 */
async function bundle(opts: *) {
  const directory = process.cwd();
  // Need to add @babel/register to support ES2015+ in config file.
  require('../babelRegister');
  const configPath = getProjectConfigPath(directory, opts.config);
  const projectConfig = getProjectConfig(configPath);
  const config = getWebpackConfig(
    new Runtime(),
    {
      platform: opts.platform,
      root: directory,
      dev: opts.dev,
      minify: opts.minify,
      bundle: true,
    },
    projectConfig
  );

  if (opts.assetsDest) {
    config.output.path = path.isAbsolute(opts.assetsDest)
      ? opts.assetsDest
      : path.join(directory, opts.assetsDest);
  }

  if (opts.bundleOutput) {
    config.output.filename = path.isAbsolute(opts.bundleOutput)
      ? path.relative(config.output.path, opts.bundleOutput)
      : path.relative(
          config.output.path,
          path.join(directory, opts.bundleOutput)
        );
  }

  logger.info(`Assets Destination: ${config.output.path}`);
  logger.info(`Bundle output: ${config.output.filename}`);
  logger.info(
    `Bundle output (resolved): ${path.resolve(config.output.filename)}`
  );

  // attach progress plugin
  if (opts.progress !== 'none') {
    config.plugins = config.plugins.concat([
      new SimpleProgressWebpackPlugin({
        format: opts.progress,
      }),
    ]);
  }

  const compiler = webpack(config);

  logger.info(
    messages.initialBundleInformation({
      entry: config.entry,
      dev: opts.dev,
    })
  );

  const stats = await new Promise((resolve, reject) =>
    compiler.run((err, info) => {
      if (err || info.hasErrors()) {
        reject(
          new MessageError(
            messages.bundleFailed({
              errors: err
                ? [err.message]
                : info.toJson({ errorDetails: true }).errors,
            })
          )
        );
      } else if (info.hasWarnings()) {
        logger.warn(info.toJson().warnings);
        resolve(info);
      } else {
        resolve(info);
      }
    })
  );

  clear();

  logger.done(
    messages.bundleBuilt({
      stats,
      platform: opts.platform,
      assetsPath: config.output.path,
      bundlePath: config.output.filename,
    })
  );
}

// Allow config file to override the list of availiable platforms
// function adjustOptions(options) {
//   // Need to add @babel/register to support ES2015+ in config file.
//   require('../babelRegister');
//   const directory = process.cwd();
//   const configPath = getProjectConfigPath(directory, options.config);
//   const haulOptions = getHaulConfig(configPath, logger);

//   if (haulOptions.platforms) {
//     const platformOption =
//       command.options && command.options.find(_ => _.name === 'platform');
//     if (platformOption) {
//       platformOption.choices = [];
//       for (const platformName in haulOptions.platforms) {
//         if (
//           Object.prototype.hasOwnProperty.call(
//             haulOptions.platforms,
//             platformName
//           )
//         ) {
//           if (platformOption.choices) {
//             platformOption.choices.push({
//               value: platformName,
//               description: `Builds ${
//                 haulOptions.platforms[platformName]
//               } bundle`,
//             });
//           }
//         }
//       }
//     }
//   }
// }

let command = ({
  name: 'bundle',
  description:
    'Builds the app bundle for packaging. Run with `--platform` flag to specify the platform [ios|android].',
  action: bundle,
  // adjustOptions,
  options: [
    {
      name: 'dev',
      description: 'Whether to build in development mode',
      default: false,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description: 'Builds in development mode',
        },
        {
          value: false,
          description: 'Builds in production mode',
        },
      ],
    },
    {
      name: 'minify',
      description: `Whether to minify the bundle, 'true' by default when dev=false`,
      default: ({ dev }: *) => !dev,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description: 'Enables minification for the bundle',
        },
        {
          value: false,
          description: 'Disables minification for the bundle',
        },
      ],
    },
    {
      name: 'platform',
      description: 'Platform to bundle for',
      required: true,
      choices: [
        {
          value: 'ios',
          description: 'Builds iOS bundle',
        },
        {
          value: 'android',
          description: 'Builds Android bundle',
        },
      ],
      example: 'haul bundle --platform ios',
    },
    {
      name: 'bundleOutput',
      description: 'Path to use for the bundle file, eg. index.ios.bundle',
    },
    {
      name: 'assetsDest',
      description: 'Path to directory where to store assets, eg. /tmp/dist',
    },
    {
      name: 'config',
      description: `Path to config file, eg. ${DEFAULT_CONFIG_FILENAME}`,
      default: DEFAULT_CONFIG_FILENAME,
    },
    {
      name: 'progress',
      description:
        'Display bundle compilation progress with different verbosity levels',
      default: () => {
        // Ensure that we don't trip Xcode's error detection. 'verbose' is the
        // only level that doesn't make Xcode think that the bundle failed.
        return !process.stdin.isTTY ? 'verbose' : 'compact';
      },
      example: 'haul bundle --progress minimal',
      choices: [
        {
          value: 'none',
          description: 'no progress',
        },
        {
          value: 'minimal',
          description: 'minimalistic, one line progress',
        },
        {
          value: 'compact',
          description: 'show stages and compilation progress',
        },
        {
          value: 'expanded',
          description: 'sho more information and phases of compilation',
        },
        {
          value: 'verbose',
          description: 'show all',
        },
      ],
    },
  ],
}: Command);

module.exports = command;
