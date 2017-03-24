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
   Webpack config wasn't found at ${path}.

   Make sure you have appropriate webpack.haul.js. 
   
   You can copy the following simplified version to set it up now:
   ${chalk.gray(`
     module.exports = {
       entry: './index.js',
     };
   `)}
`;
