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

module.exports = ({ path }: { path: string }) => dedent`
   Webpack configuration wasn't found at ${path}.

   Make sure:
   • You have a ${chalk.bold('webpack.haul.js')} file
   • You are running haul from your project directory

   You can copy this to ${chalk.bold('webpack.haul.js')} to get started:
   ${chalk.gray(`
     module.exports = {
       entry: './index.js',
     };
   `)}
`;
