/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const chalk = require('chalk');

module.exports = ({ command }: { command: string }) =>
  `Successfully ran ${chalk.bold(command)}\n`;
