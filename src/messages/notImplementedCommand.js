/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (command: string) => dedent`
  This command is not yet supported

  Call ${chalk.bold(`react-native ${command}`)} instead
`;
