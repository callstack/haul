/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * webpackConfigNotFound.js
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = ({ directory }: { directory: string }) => dedent`
   Couldn't find configuration file in ${chalk.bold(directory)}

   Make sure:
   • You are running haul from your project directory
   • You have a ${chalk.bold('webpack.haul.js')} file

   You can copy this to ${chalk.bold('webpack.haul.js')} to get started:
   ${chalk.gray(`
     module.exports = {
       entry: './index.js',
     };
   `)}
`;
