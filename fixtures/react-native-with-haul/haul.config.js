import { createWebpackConfig } from 'haul';

export default {
  webpack: createWebpackConfig(({ platform }) => ({
    entry: `./index.js`,
  })),
};
