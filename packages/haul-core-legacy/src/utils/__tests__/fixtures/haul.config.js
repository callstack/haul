const { createWebpackConfig } = require('../../../index');

module.exports = {
  webpack: createWebpackConfig(() => ({
    entry: `./index.js`,
  })),
};
