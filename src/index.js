const { createWebpackConfig } = require('./utils/makeReactNativeConfig');

module.exports = {
  /**
   * Export helper function for building a config for Haul (default haul.config.js)
   * 
   * import { createWebpackConfig } from 'haul';
   *
   * export default {
   *   webpack: createWebpackConfig(({ platform }) => {
   *     entry: `./index.${platform}.js`,
   *     include: /node_modules/,
   *   }),
   *  }
   */
  createWebpackConfig,
};
