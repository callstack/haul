import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.59";

function resolveReactNative({ config }) {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Force React Native to be resolved in exampleApp_0_59x's node_modules
        'react-native': require.resolve('react-native'),
        'react': require.resolve('react'),
      },
    },
  };
}

export default makeConfig({
  bundles: {
    host: {
      entry: withPolyfills('./src/host.js', { root: __dirname }),
      transform: resolveReactNative,
      dllDependencies: ['base_dll'],
    },
    base_dll: {
      dll: true,
      entry: withPolyfills(['react', 'react-native', './src/sharedBase.js'], { root: __dirname }),
      transform: resolveReactNative,
      dllDependencies: ['shared_base_dll']
    },
    shared_app_dll: {
      dll: true,
      entry: './src/sharedBase.js',
    },
    shared_base_dll: {
      dll: true,
      entry: './src/sharedApp.js',
    },
    app0: {
      entry: './src/app0.js',
      transform: resolveReactNative,
      dllDependencies: ['base_dll', 'shared_dll'],
    },
    app1: {
      entry: './src/app1.js',
      transform: resolveReactNative,
      dllDependencies: ['base_dll', 'shared_dll'],
    },
  },
});