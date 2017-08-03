/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const chalk = require('chalk');
const dedent = require('dedent');

module.exports = (platform: ?string) => dedent`
  Unable to find a webpack compiler for ${chalk.bold(platform || '<null>')}.

  Check your middleware to ensure you're passing the correct platform to getCompilerByPlatform().

  Returning the first compiler in the list.  Your source maps *might* be off if you're using platform-specific code.
`;
