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

module.exports = function getWebpackConfig(cwd: string, config: string) {
  let configPath;

  if (path.isAbsolute(config)) {
    configPath = config;
  } else {
    configPath = path.join(cwd, config);
  }

  if (!fs.existsSync(configPath)) {
    throw new MessageError(messages.webpackConfigNotFound(configPath));
  }

  return configPath;
};
