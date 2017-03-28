/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = () => dedent`
  You have to specify ${chalk.cyan('--platform')} when running ${chalk.bold('haul bundle')}

  Available options:
  • ${chalk.bold('ios')} - builds iOS bundle
  • ${chalk.bold('android')} - builds Android bundle

  Example: ${chalk.cyan('haul bundle --platform ios')}
`;
