/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const chalk = require('chalk');

const constants = require('../constants');

module.exports = () =>
  `Generated ${chalk.bold(constants.DEFAULT_CONFIG_FILENAME)}`;
