/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (command: string) => dedent`
  We are working on supporting this command.
  Call ${chalk.bold(`react-native ${command}`)} instead for now.
`;
