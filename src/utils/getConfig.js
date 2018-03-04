/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { Logger } from '../types';

const { makeReactNativeConfig } = require('./makeReactNativeConfig');

module.exports = function getConfig(
  configPath: string,
  configOptions: any,
  platform: string,
  logger: Logger
) {
  // $FlowFixMe
  let config = require(configPath);
  config = config.__esModule ? config.default : config;

  return makeReactNativeConfig(config, configOptions, platform, logger);
};
