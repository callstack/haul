/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const path = require('path');
const webpack = require('webpack');
const clear = require('clear');

const { MessageError } = require('../errors');
const messages = require('../messages');
const makeReactNativeConfig = require('../utils/makeReactNativeConfig');
const getWebpackConfig = require('../utils/getWebpackConfig');
const logger = require('../logger');

/**
 * Bundles your application code
 */
async function bundle(opts: *) {
  const directory = process.cwd();
  const configPath = getWebpackConfig(directory, opts.config);

  // eslint-disable-next-line prefer-const
  let [config, platforms] = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      root: directory,
      dev: opts.dev,
      minify: opts.minify,
      bundle: true,
    },
  );

  if (opts.platform !== 'all' && platforms.includes(opts.platform)) {
    config = config[platforms.indexOf(opts.platform)];
  }

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
          path.join(directory, opts.bundleOutput),
        );
  }

  const compiler = webpack(config);

  logger.info(
    messages.initialBundleInformation({
      entries: Array.isArray(config)
        ? config.map(c => c.entry)
        : [config.entry],
      dev: opts.dev,
    }),
  );

  const stats = await new Promise((resolve, reject) =>
    compiler.run((err, info) => {
      if (err || info.hasErrors()) {
        reject(new MessageError(messages.bundleFailed()));
      } else {
        resolve(info);
      }
    }));

  clear();

  logger.done(
    messages.bundleBuilt({
      stats,
      platform: opts.platform,
      outputs: Array.isArray(config)
        ? config.map(c => c.output)
        : [config.output],
    }),
  );
}

module.exports = {
  name: 'bundle',
  description: 'Builds the app bundle for packaging',
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
        {
          value: 'all',
          description: 'Builds both platforms',
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
      description: 'Path to config file, eg. webpack.haul.js',
      default: 'webpack.haul.js',
    },
  ],
};
