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
  DEFAULT_CONFIG_FILENAME,
  DEPRECATED_DEFAULT_CONFIG_FILENAME,
} = require('../constants');

module.exports = function getWebpackConfigPath(
  cwd: string,
  config: string = DEFAULT_CONFIG_FILENAME
) {
  const getConfigPath = file =>
    path.isAbsolute(file) ? file : path.join(cwd, file);

  let configPath = getConfigPath(config);
  /**
   * If the file doesn't exist let's check if doesn't exist the DEFAULT_CONFIG_FILENAME
   * if so we want to fallback to default configuration (null)
   * if doesn't exist file specified by user we should inform about it
   */
  if (!fs.existsSync(configPath)) {
    if (
      ![DEFAULT_CONFIG_FILENAME, DEPRECATED_DEFAULT_CONFIG_FILENAME].includes(
        config
      )
    ) {
      throw new MessageError(messages.webpackConfigNotFound(configPath));
    }

    /**
     * For some time we want to check also this:
     * If we wasn't able to locate DEFAULT_CONFIG_FILENAME maybe we could be successful
     * in search to DEPRECATED_DEFAULT_CONFIG_FILENAME, let's return it if we have found it.
     *
     * Once we are about to remove this we can refactor L13 back to: `if (config !== DEFAULT_CONFIG_FILENAME)`
     * @deprecated
     */
    if (fs.existsSync(getConfigPath(DEPRECATED_DEFAULT_CONFIG_FILENAME))) {
      return getConfigPath(DEPRECATED_DEFAULT_CONFIG_FILENAME);
    }

    /**
     * Null is flag for 'zero-config' mode
     */
    configPath = null;
  }

  return configPath;
};
