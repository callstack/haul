/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');
const getEntryFiles = require('../utils/getEntryFiles');

type Params = {
  entry: string | Array<string> | Object,
  dev: boolean,
};

module.exports = (config: Params) => {
  const mode = config.dev ? 'development' : 'production';
  return dedent`
    Haul is now bundling your React Native app in ${chalk.bold(mode)} mode.
    
    Starting from:

    ${chalk.grey(getEntryFiles(config.entry))}
  `;
};
