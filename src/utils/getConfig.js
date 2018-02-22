/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { Platform } from '../types';

const { makeReactNativeConfig } = require('./makeReactNativeConfig');

module.exports = function getConfig(
  configPath: string,
  configOptions: any,
  platform: Platform
) {
  let config;
  try {
    // $FlowFixMe
    config = require(configPath);
    config = config.__esModule ? config.default : config;
  } catch (e) {
    throw new Error(
      'Haul configuration cannot be loaded. Have you provided valid JS file?'
    );
  }

  return makeReactNativeConfig(config, configOptions, platform);
};
