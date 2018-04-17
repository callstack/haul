/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const path = require('path');
const webpack = require('webpack');
const clear = require('clear');
const { DEFAULT_CONFIG_FILE_PATH } = require('../constants');

const { MessageError } = require('../errors');
const messages = require('../messages');
const getWebpackConfigPath = require('../utils/getWebpackConfigPath');
const getConfig = require('../utils/getConfig');
const logger = require('../logger');

/**
 * Bundles your application code
 */
async function bundle(opts: *) {
  const directory = process.cwd();
  const configPath = getWebpackConfigPath(directory, opts.config);

  const config = getConfig(
    configPath,
    { root: directory, dev: opts.dev, minify: opts.minify, bundle: true },
    opts.platform,
    logger
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

module.exports = ({
  name: 'bundle',
  description:
    'Builds the app bundle for packaging. Run with `--platform` flag to specify the platform [ios|android].',
  action: bundle,
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
      description: `Path to config file, eg. ${DEFAULT_CONFIG_FILE_PATH}`,
      default: DEFAULT_CONFIG_FILE_PATH,
    },
  ],
}: Command);
