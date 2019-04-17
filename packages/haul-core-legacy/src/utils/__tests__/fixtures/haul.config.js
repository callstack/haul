const { createWebpackConfig } = require('haul'); //eslint-disable-line

module.exports = {
  webpack: createWebpackConfig(() => ({
    entry: `./index.js`,
  })),
};
