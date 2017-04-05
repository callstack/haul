/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Logger } from './types';

const chalk = require('chalk');

let lastChar = '\n';

const last = arr => arr[arr.length - 1];

const section = (...args) => {
  if (lastChar !== '\n') {
    console.log('\n');
  }

  log(...args);
};

const log = (...args) => {
  lastChar = last(last(args));

  console.log(...args);
};

const logger: Logger = {
  info: (...args: any[]) => section(chalk.black.bgCyan(' INFO '), ...args),
  warn: (...args: any[]) => section(chalk.black.bgYellow(' WARN '), ...args),
  error: (...args: any[]) => section(chalk.black.bgRed(' ERROR '), ...args),
  done: (...args: any[]) => section(chalk.black.bgGreen(' DONE '), ...args),
  debug: (prefix: string, ...args: any[]) =>
    log(chalk.cyan(prefix.toUpperCase()), ...args.map(str => chalk.grey(str))),
};

module.exports = logger;
