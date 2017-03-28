/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = () => dedent`
  You have passed invalid ${chalk.cyan('--platform')} when running ${chalk.bold('haul bundle')}

  Available options:
  • ${chalk.bold('ios')} - bundles iOS bundle
  • ${chalk.bold('android')} - bundles Android bundle

  Example: ${chalk.cyan('haul bundle --platform ios')}
`;
