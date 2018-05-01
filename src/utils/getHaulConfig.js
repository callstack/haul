/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
import type { Logger } from '../types';

const path = require('path');
const loggerUtil = require('../logger');
const { createWebpackConfig } = require('../index');

function getUserConfig(configPath: ?string, logger?: Logger = loggerUtil) {
  let config;

  /**
   * When it doesn't have DEFAULT_CONFIG_FILENAME and it's not specified another file
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
      `Couldn't find "haul.config.js". Using default configuration.\nFound entry file at ${entry}.`
    );
  } else {
    // $FlowFixMe
    config = require(configPath);
    config = config.__esModule ? config.default : config;
  }

  return config;
}

function getHaulConfig(configPath: ?string, logger?: Logger = loggerUtil) {
  const config = getUserConfig(configPath, logger);

  if (!config) return {};
  const { webpack, ...haulConfig } = config;
  return haulConfig;
}

module.exports = {
  getUserConfig,
  getHaulConfig,
};
