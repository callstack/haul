/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { Platform } from '../../types';

const { makeReactNativeConfig } = require('../../utils/makeReactNativeConfig');

module.exports = function getConfig(
  configPath: string,
  configOptions: any,
  platform: Platform
) {
  return makeReactNativeConfig(
    // $FlowFixMe
    require(configPath),
    configOptions,
    platform
  );
};
