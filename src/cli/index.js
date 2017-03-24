/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

// @todo transpile on build
require('babel-register')({
  ignore: /node_modules(?!\/haul)/,
  plugins: ['transform-flow-strip-types'],
  retainLines: true,
  sourceMaps: 'inline',
  babelrc: false,
});

require('./cli');
