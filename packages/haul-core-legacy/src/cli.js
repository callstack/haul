/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* eslint-disable */

// dump start parameters
const isVerbose = process.argv.includes('--verbose');
if (isVerbose) {
  require('./logger').done(`${process.argv.join(' ')}`);
}

require('./cliEntry')(process.argv.slice(2));
