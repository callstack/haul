/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (command: string) => dedent`
  Command ${chalk.bold(command)} not found

  Run ${chalk.cyan(`haul --help`)} to see a list of available commands
`;
