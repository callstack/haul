/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/* eslint-disable */

// babel-preset-env will transform the line below into
// individual requires for babel-polyfill based on environment
require('babel-polyfill')

// dump start parameters
const isVerbose = process.argv.includes('--verbose')
if (isVerbose) {
  require('./logger').done(`${process.argv.join(' ')}`)
}

require('./cliEntry')(process.argv.slice(2))
