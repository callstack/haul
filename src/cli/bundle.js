/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const clear = require('clear');

const { MessageError } = require('../errors');
const messages = require('../messages');
const makeReactNativeConfig = require('../utils/makeReactNativeConfig');
const logger = require('../logger');

/**
 * Bundles your application code
 */
async function bundle(argv: Array<string>, opts: *) {
  const directory = process.cwd();
  const configPath = path.join(directory, 'webpack.haul.js');

  if (!opts.platform) {
    throw new MessageError(messages.bundleOptionPlatformMissing());
  }

  if (!fs.existsSync(configPath)) {
    throw new MessageError(
      messages.webpackConfigNotFound({
        directory,
      }),
    );
  }

  const [
    configs,
    availablePlatforms,
  ] = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      dev: opts.dev,
      cwd: directory,
    },
  );

  if (!availablePlatforms.includes(opts.platform)) {
    throw new MessageError(messages.bundleOptionPlatformInvalid());
  }

  const config = configs[availablePlatforms.indexOf(opts.platform)];

  if (opts.assetsDest && path.isAbsolute(opts.assetsDest)) {
    config.output.path = opts.assetsDest;
  }

  if (opts.bundleOutput && path.isAbsolute(opts.bundleOutput)) {
    config.output.filename = path.relative(
      config.output.path,
      opts.bundleOutput,
    );
  }

  const compiler = webpack(config);

  logger.info(
    messages.initialBundleInformation({
      entry: config.entry,
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
    messages.bundleCompiled({
      stats,
      platform: opts.platform,
      assetsPath: config.output.path,
      bundlePath: config.output.filename,
    }),
  );
}

module.exports = {
  name: 'bundle',
  description: 'Builds your application bundle for offline use',
  action: bundle,
  // Allow unknown flags for interoperability with 'react-native bundle'
  unknownOptions: true,
  options: [
    {
      name: '--dev [true|false]',
      description: 'Whether to build in development mode',
      default: true,
      parse: (val: string) => JSON.parse(val),
    },
    {
      name: '--platform <ios|android>',
      description: 'Platform to bundle for',
    },
    {
      name: '--bundle-output [string]',
      description: 'Absolute path to directory where to store the bundle, eg. index.ios.bundle',
    },
    {
      name: '--assets-dest [string]',
      description: 'Absolute path to directory where to store assets, eg. /tmp/dist',
    },
  ],
};
