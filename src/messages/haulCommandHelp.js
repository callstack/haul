/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const chalk = require('chalk');
const cliui = require('cliui');
const decamelize = require('decamelize');

const printName = option => {
  const [start, end] = option.required ? ['<', '>'] : ['[', ']'];

  let arg = 'string';
  if (typeof option.parse === 'function') {
    arg = option.parse.name;
  }
  if (option.choices) {
    arg = option.choices.map(c => c.value).join('|');
  }

  return `--${decamelize(option.name, '-')} ${start}${arg.toLowerCase()}${end}`;
};

const printDescription = option => {
  if (option.default && typeof option.default !== 'function') {
    const def = `${String(option.default)} by default`;
    return `${option.description}, ${def}`;
  }

  return option.description;
};

module.exports = (command: Command) => {
  const ui = cliui({
    width: 100,
  });

  ui.div(chalk.bold.cyan(`haul ${command.name} [options]`));

  ui.div(`${command.description}`);

  if (command.options && command.options.length > 0) {
    ui.div(`\n${chalk.bold('Options:')}\n`);

    ui.div(
      // $FlowFixMe: We already checked for undefined
      command.options
        .map(
          option =>
            `  ${printName(option)}   \t ${chalk.gray(
              printDescription(option),
            )}`,
        )
        .join('\n'),
    );
  }

  return ui.toString();
};
