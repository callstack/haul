/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const chalk = require('chalk');

module.exports = ({ error, command }: { error: Error, command: string }) =>
  `Error running ${chalk.bold(command)}: ${chalk.grey(error.message)}`;
