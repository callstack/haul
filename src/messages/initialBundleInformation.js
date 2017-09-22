/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');
const entryPointList = require('./entryPointList');

type Params = {
  entry: Array<string>,
  dev: boolean,
};

module.exports = (config: Params) => {
  const mode = config.dev ? 'development' : 'production';

  return dedent`
    Haul is now bundling your React Native app in ${chalk.bold(mode)} mode.

    Starting from:

    ${entryPointList({ entries: [config.entry] })} \n
  `;
};
