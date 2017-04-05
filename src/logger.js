/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Logger } from './types';

const chalk = require('chalk');

const logger: Logger = {
  info: (...args: any[]) => console.log(chalk.black.bgCyan(' INFO '), ...args),
  warn: (...args: any[]) =>
    console.log(chalk.black.bgYellow(' WARN '), ...args),
  error: (...args: any[]) => console.log(chalk.black.bgRed(' ERROR '), ...args),
  done: (...args: any[]) => console.log(chalk.black.bgGreen(' DONE '), ...args),
  debug: (prefix: string, ...args: any[]) =>
    console.log(
      chalk.cyan(prefix.toUpperCase()),
      ...args.map(str => chalk.grey(str)),
    ),
};

module.exports = logger;
