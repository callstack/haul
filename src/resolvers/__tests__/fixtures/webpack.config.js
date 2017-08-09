/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const os = require('os');
const AssetResolver = require('../../AssetResolver');
const HasteResolver = require('../../HasteResolver');

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: os.tmpdir(),
  },
  resolve: {
    plugins: [
      new HasteResolver({ directories: [__dirname] }),
      new AssetResolver({ platform: 'ios' }),
    ],
  },
};
