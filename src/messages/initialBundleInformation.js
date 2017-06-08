/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');
const path = require('path');

type Params = {
  entry: Array<string>,
  dev: boolean,
};

const getEntryFile = (entries: Array<string>) => {
  return path.resolve(process.cwd(), entries[entries.length - 1]);
};

module.exports = (config: Params) => {
  const mode = config.dev ? 'development' : 'production';

  return dedent`
    Haul is now bundling your React Native app in ${chalk.bold(mode)} mode.

    Starting from:

    ${config.entries.map(e => chalk.grey(getEntryFile(e))).join('\n')}\n
  `;
};
