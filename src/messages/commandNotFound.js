/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (command: string) => {
  const message = `Run ${chalk.cyan(`haul --help`)} to see a list of available commands`;

  if (command) {
    return dedent`
      Command ${chalk.bold(command)} not found

      ${message}
    `;
  }

  return message;
};
