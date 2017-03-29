/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../../types';

const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (commands: Array<Command>) => dedent`

  Usage: haul [command] [options]

  Options:

    --version       output the version number
    --help          output usage information

  Commands:

    ${commands
  .map(command => `- ${command.name}       ${command.description}`)
  .join('\n')}

  Run ${chalk.bold('haul help COMMAND')} for more information on specific commands
`;
