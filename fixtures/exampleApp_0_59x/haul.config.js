import { createWebpackConfig } from "../../packages/haul-preset-0.59";

export default {
  webpack: (runtime, env) => {
    const config = createWebpackConfig({
      entry: './index.js',
    })(runtime, env);

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Force React Native to be resolved in exampleApp_0_59x's node_modules
        'react-native': require.resolve('react-native')
      }
    }

    return config;
  },
  // ramBundle: {
  //   debug: {
  //     path: 'ram_bundle',
  //     renderBootstrap: true,
  //     renderModules: true,
  //   }
  // }
};