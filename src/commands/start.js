/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const webpack = require('webpack');
const path = require('path');
const clear = require('clear');

const logger = require('../logger');
const createServer = require('../server');
const messages = require('../messages');
const exec = require('../utils/exec');
const getWebpackConfig = require('../utils/getWebpackConfig');

const makeReactNativeConfig = require('../utils/makeReactNativeConfig');

/**
 * Starts development server
 */
async function start(opts: *) {
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
    },
  );

  if (opts.platform !== 'all' && platforms.includes(opts.platform)) {
    config = config[platforms.indexOf(opts.platform)];
  }

  const compiler = webpack(config);

  const app = createServer(
    compiler,
    didHaveIssues => {
      clear();
      if (didHaveIssues) {
        logger.warn(messages.bundleBuilding(didHaveIssues));
      } else {
        logger.info(messages.bundleBuilding(didHaveIssues));
      }
    },
    stats => {
      clear();
      if (stats.hasErrors()) {
        logger.error(messages.bundleFailed());
      } else {
        logger.done(
          messages.bundleBuilt({
            stats,
            platform: opts.platform,
          }),
        );
      }
    },
  );

  // Run `adb reverse` on Android
  if (opts.platform === 'android') {
    const args = `reverse tcp:${opts.port} tcp:${opts.port}`;
    const adb = process.env.ANDROID_HOME
      ? `${process.env.ANDROID_HOME}/platform-tools/adb`
      : 'adb';

    try {
      await exec(`${adb} ${args}`);
      logger.info(
        messages.commandSuccess({
          command: `${path.basename(adb)} ${args}`,
        }),
      );
    } catch (error) {
      logger.warn(
        messages.commandFailed({
          command: `${path.basename(adb)} ${args}`,
          error,
        }),
      );
    }
  }

  app.listen(opts.port, () => {
    logger.info(
      messages.initialStartInformation({
        entries: Array.isArray(config)
          ? config.map(c => c.entry)
          : [config.entry],
        port: opts.port,
      }),
    );
  });
}

module.exports = {
  name: 'start',
  description: 'Starts a new webpack server',
  action: start,
  options: [
    {
      name: 'port',
      description: 'Port to run your webpack server',
      default: 8081,
      parse: Number,
    },
    {
      name: 'dev',
      description: 'Whether to build in development mode',
      default: true,
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
      example: 'haul start --platform ios',
      required: true,
      choices: [
        {
          value: 'ios',
          description: 'Serves iOS bundle',
        },
        {
          value: 'android',
          description: 'Serves Android bundle',
        },
        {
          value: 'all',
          description: 'Serves both platforms',
        },
      ],
    },
    {
      name: 'config',
      description: 'Path to config file, eg. webpack.haul.js',
      default: 'webpack.haul.js',
    },
  ],
};
