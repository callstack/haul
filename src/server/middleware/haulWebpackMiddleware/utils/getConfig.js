/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const makeReactNativeConfig = require('../../../../utils/makeReactNativeConfig');

module.exports = (configPath, configOptions, platform) => {
  const config = makeReactNativeConfig(
    require(configPath),
    configOptions,
    platform
  );

  return config;
};
