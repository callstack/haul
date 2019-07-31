import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      transform({ config }) {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...config.resolve.alias,
              // Force React Native to be resolved in exampleApp_0_59x's node_modules
              'react-native': require.resolve('react-native'),
            },
          },
        };
      },
    },
  },
});