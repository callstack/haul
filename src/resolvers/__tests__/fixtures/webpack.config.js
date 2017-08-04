const AssetResolver = require('../../AssetResolver');
const path = require('path');
const os = require('os');

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: os.tmpdir(),
  },
  resolve: {
    plugins: [new AssetResolver({ platform: 'ios' })],
  },
};
