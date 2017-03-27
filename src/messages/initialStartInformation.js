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
  entries: Array<Array<string>>,
  port: number,
};

const getEntryFile = (entries: Array<string>) => {
  return path.resolve(process.cwd(), entries[entries.length - 1]);
};

module.exports = (config: Params) => dedent`
  Ready at ${chalk.cyan(`http://localhost:${config.port}`)}

  Haul is now bundling your React Native app, starting from:

  ${config.entries.map(e => chalk.grey(getEntryFile(e))).join('\n')}

  A fresh build may take longer than usual\n
`;
