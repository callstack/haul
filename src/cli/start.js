/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { CommandArgs } from '../types';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const clear = require('clear');

const logger = require('../logger');
const createServer = require('../server');
const messages = require('../messages');
const exec = require('../utils/exec');
const { MessageError } = require('../errors');

const makeReactNativeConfig = require('../utils/makeReactNativeConfig');

/**
 * Starts development server
 */
async function start(argv: CommandArgs, opts: *) {
  const directory = process.cwd();
  const configPath = path.join(directory, 'webpack.haul.js');

  if (!opts.platform) {
    throw new MessageError(messages.optionPlatformMissing());
  }

  if (!fs.existsSync(configPath)) {
    throw new MessageError(
      messages.webpackConfigNotFound({
        directory,
      }),
    );
  }

  // eslint-disable-next-line prefer-const
  let [config, platforms] = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      dev: opts.dev,
      cwd: directory,
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
    } catch (error) {
      logger.warn(
        messages.commandFailed({
          command: `${path.basename(adb)} ${args}`,
          error,
        }),
      );
    }
  }

  // $FlowFixMe Seems to have issues with `http.Server`
  app.listen(8081, '127.0.0.1', () => {
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
      name: '--port [number]',
      description: 'Port to run your webpack server',
      default: 8081,
      parse: (val: string) => +val,
    },
    {
      name: '--dev [true|false]',
      description: 'Whether to build in development mode',
      default: true,
      parse: (val: string) => JSON.parse(val),
    },
    {
      name: '--platform <ios|android|all>',
      description: 'Platform to bundle for',
    },
  ],
};
