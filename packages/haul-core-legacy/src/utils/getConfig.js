/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Platform, Logger } from '../types';

const loggerUtil = require('../logger');
const { makeReactNativeConfig } = require('./makeReactNativeConfig');
const { getUserConfig } = require('./getHaulConfig');

module.exports = function getConfig(
  configPath: ?string,
  configOptions: any,
  platform: Platform,
  logger?: Logger = loggerUtil
) {
  const config = getUserConfig(configPath);
  // $FlowFixMe
  return makeReactNativeConfig(config, configOptions, platform, logger);
};
