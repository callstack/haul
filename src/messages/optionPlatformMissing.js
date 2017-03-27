/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = () => dedent`
  You have to specify ${chalk.cyan('--platform')} when running ${chalk.bold('haul start')}

  Available options:
  • ${chalk.bold('ios')} - serves iOS bundle
  • ${chalk.bold('android')} - serves Android bundle
  • ${chalk.bold('all')} - serves all bundles at once

  Example: ${chalk.cyan('haul start --platform ios')}

  Note: ${chalk.bold('--platform=all')} is similar to how React Native packager works - you can run iOS and Android versions of your app at the same time. It will become the default value in future after we fix the performance issues.
`;
