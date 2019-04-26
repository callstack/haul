import { createWebpackConfig } from "../../packages/haul-cli/build/api";

export default {
  webpack: env => {
    const config = createWebpackConfig({
      entry: './index.js',
    })(env);

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Force React Native to be resolved in exampleApp_0_59x's node_modules
        'react-native': require.resolve('react-native')
      }
    }

    return config;
  }
};