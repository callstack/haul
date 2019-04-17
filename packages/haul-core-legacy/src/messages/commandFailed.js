/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const chalk = require('chalk');
const dedent = require('dedent');

module.exports = ({
  error,
  command,
  stack,
}: {
  error: Error,
  command: string,
  stack?: string,
}) => {
  if (!stack) {
    return `Error running ${chalk.bold(command)}: ${chalk.grey(error.message)}`;
  }

  return dedent`
    Error running ${chalk.bold(command)}

    ${chalk.grey(stack)}
  `;
};
