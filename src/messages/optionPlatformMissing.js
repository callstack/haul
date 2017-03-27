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

  Note: ${chalk.bold('--platform=all')} is similiar to the way React Packager works - you can
  run both iOS and Android devices at the same time. In the future, this will become
  a default value for ${chalk.bold('--platform')}. Until we fix its performance, it remains
  behind a flag.
`;
