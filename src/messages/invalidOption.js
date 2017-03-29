/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { CommandOption } from '../types';

const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (
  {
    option,
    value,
    command,
  }: { option: CommandOption, value?: mixed, command: string },
) => {
  let message = dedent`
    You have to specify ${chalk.cyan(`--${option.name}`)} when running ${chalk.bold(command)}
  `;

  if (value) {
    message = dedent`
      Value ${chalk.bold(value)} for ${chalk.cyan(`--${option.name}`)} is incorrect
    `;
  }

  if (option.choices) {
    message = dedent`
      ${message}

      Available options:
      ${option.choices
      .map(choice => `• ${chalk.bold(choice.value)} - ${choice.description}`)
      .join('\n')}
    `;
  }

  if (option.example) {
    message = dedent`
      ${message}

      Example: ${chalk.cyan(option.example)}
    `;
  }

  if (option.note) {
    message = dedent`
      ${message}

      Note: ${option.note}
    `;
  }

  return message;
};
