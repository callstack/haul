/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * bundleCompiling.js
 *
 * @flow
 */
const chalk = require('chalk');
const dedent = require('dedent');

module.exports = (didHaveIssues: boolean) => {
  if (didHaveIssues) {
    return dedent`
      ${chalk.yellow('Compiling after issues...')}

      Note this may take longer than usual
    `;
  }

  return chalk.cyan('Compiling...');
};
