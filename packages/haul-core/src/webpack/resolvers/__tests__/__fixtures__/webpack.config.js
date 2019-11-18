
import path from 'path';
import os from 'os';
import AssetResolver from '../../AssetResolver';
import HasteResolver from '../../HasteResolver';
import Runtime from '../../../../runtime/Runtime';

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
