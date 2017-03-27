/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = ({ error, command }: { error: Error, command: string }) =>
  dedent(
    `
  There was an error running ${chalk.bold(command)}

  Details:

    ${chalk.grey(error.message)}
`
  );
