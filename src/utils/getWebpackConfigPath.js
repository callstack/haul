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
const {
  DEFAULT_CONFIG_FILE_PATH,
  DEPRECATED_DEFAULT_CONFIG_FILE_PATH,
} = require('../constants');

module.exports = function getWebpackConfigPath(
  cwd: string,
  config: string = DEFAULT_CONFIG_FILE_PATH
) {
  const getConfigPath = file =>
    path.isAbsolute(file) ? file : path.join(cwd, file);

  let configPath = getConfigPath(config);
  /**
   * If the file doesn't exist let's check if doesn't exist the DEFAULT_CONFIG_FILE_PATH
   * if so we want to fallback to default configuration (null)
   * if doesn't exist file specified by user we should inform about it
   */
  if (!fs.existsSync(configPath)) {
    if (
      ![DEFAULT_CONFIG_FILE_PATH, DEPRECATED_DEFAULT_CONFIG_FILE_PATH].includes(
        config
      )
    ) {
      throw new MessageError(messages.webpackConfigNotFound(configPath));
    }

    /**
     * For some time we want to check also this:
     * If we wasn't able to locate DEFAULT_CONFIG_FILE_PATH maybe we could be successful
     * in search to DEPRECATED_DEFAULT_CONFIG_FILE_PATH, let's return it if we have found it.
     *
     * Once we are about to remove this we can refactor L13 back to: `if (config !== DEFAULT_CONFIG_FILE_PATH)`
     * @deprecated
     */
    if (fs.existsSync(getConfigPath(DEPRECATED_DEFAULT_CONFIG_FILE_PATH))) {
      return getConfigPath(DEPRECATED_DEFAULT_CONFIG_FILE_PATH);
    }

    /**
     * Null is flag for 'zero-config' mode
     */
    configPath = null;
  }

  return configPath;
};
