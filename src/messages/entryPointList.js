/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const chalk = require('chalk');
const path = require('path');

type Params = {
  entries: Array<Array<string>>,
};

function getEntryFiles(entry) {
  if (Array.isArray(entry)) {
    return [path.resolve(process.cwd(), entry[entry.length - 1])];
  } else if (typeof entry === 'string') {
    return [path.resolve(process.cwd(), entry)];
  } else if (typeof entry === 'object') {
    return Object.keys(entry)
      .map(k => getEntryFiles(entry[k]))
      .reduce((a, b) => a.concat(b), []);
  }
  return [String(entry)];
}

module.exports = (config: Params) =>
  config.entries
    .map(getEntryFiles)
    .reduce((a, b) => a.concat(b), [])
    .map(s => chalk.grey(s))
    .join('\n');
