/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * initialStartInstructions.js
 *
 * @flow
 */
const dedent = require('dedent');
const chalk = require('chalk');

module.exports = (
  { port, platform }: { port: string, platform: string }
) => dedent`
  ${chalk.green('Compiled successfully!')}
  
  You can now go to your ${platform} device to run the app.
`;
