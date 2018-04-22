/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
import type { Platform, Logger } from '../types';

const path = require('path');
const loggerUtil = require('../logger');
const { createWebpackConfig } = require('../index');
const { makeReactNativeConfig } = require('./makeReactNativeConfig');

module.exports = function getConfig(
  configPath: ?string,
  configOptions: any,
  platform: Platform,
  logger?: Logger = loggerUtil
) {
  let config;

  /**
   * When it doesn't have DEFAULT_CONFIG_FILE_PATH and it's not specified another file
   * we will use default configuration based on main file from package.json
   */
  if (configPath === null) {
    // $FlowFixMe
    let entry = require(path.resolve(process.cwd(), 'package.json')).main;

    if (!entry) entry = 'index.js';

    /**
     * Make it relative for Webpack
     */
    entry = `./${entry}`;

    config = {
      webpack: createWebpackConfig({ entry }),
    };
    logger.info(
      `We're not able to locate haul.config.js.\nTrying to serve app with the default configuration from ${entry}`
    );
  } else {
    // $FlowFixMe
    config = require(configPath);
    config = config.__esModule ? config.default : config;
  }

  // $FlowFixMe
  return makeReactNativeConfig(config, configOptions, platform, logger);
};
