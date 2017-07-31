/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (directory: string) => dedent`
   Couldn't find configuration file ${chalk.bold(directory)}

   Make sure:
   • You are running haul from your project directory
   • You have a ${chalk.bold('webpack.haul.js')} file

   Run ${chalk.bold('haul init')} to automatically generate a ${chalk.bold(
  'webpack.haul.js',
)} file
`;
