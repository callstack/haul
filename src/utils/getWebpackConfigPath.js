/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const path = require('path');
const fs = require('fs');
const { MessageError } = require('../errors');
const messages = require('../messages');
const { DEFAULT_CONFIG_FILE_PATH } = require('../constants');

module.exports = function getWebpackConfigPath(cwd: string, config: string) {
  let configPath;

  if (path.isAbsolute(config)) {
    configPath = config;
  } else {
    configPath = path.join(cwd, config);
  }

  /**
   * If the file doesn't exist let's check if doesn't exist the DEFAULT_CONFIG_FILE_PATH
   * if so we want to fallback to default configuration (null)
   * if doesn't exist file specified by user we should inform about it
   */
  if (!fs.existsSync(configPath)) {
    if (config !== DEFAULT_CONFIG_FILE_PATH) {
      throw new MessageError(messages.webpackConfigNotFound(configPath));
    }

    configPath = null;
  }

  return configPath;
};
