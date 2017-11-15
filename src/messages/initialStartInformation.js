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
  entries: any,
  port: number,
  isMulti: boolean,
};

module.exports = (config: Params) => {
  const messages = config.isMulti
    ? config.entries.map(entry => getEntryFiles(entry))
    : [getEntryFiles(config.entries)];

  return dedent`
  Ready at ${chalk.cyan(`http://localhost:${config.port}`)}

  Haul is now bundling your React Native app, starting from:

  ${messages.join('\n')}

  A fresh build may take longer than usual\n
`;
};
