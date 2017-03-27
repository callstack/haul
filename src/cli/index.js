/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

// @todo transpile on build
require('babel-register')({
  ignore: /node_modules(?!\/haul)/,
  retainLines: true,
  sourceMaps: 'inline',
});

require('./cli');
