
const path = require('path');
const os = require('os');
const AssetResolver = require('../../AssetResolver');
const HasteResolver = require('../../HasteResolver');
import Runtime from '../../../runtime/Runtime';

const runtime = new Runtime();

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: os.tmpdir(),
  },
  resolve: {
    plugins: [
      new HasteResolver({ directories: [__dirname] }),
      new AssetResolver({ platform: 'ios', runtime }),
    ],
  },
};
