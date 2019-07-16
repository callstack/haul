import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./src/host.js'),
      dependsOn: ['base_dll'],
    },
    base_dll: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
        './src/BundleRegistry.js'
      ]),
      dll: true,
    },
    app0: {
      entry: './src/app0',
      dependsOn: ['base_dll'],
      app: true,
    },
    app1: {
      entry: './src/app1',
      dependsOn: ['base_dll'],
      app: true,
    }
  },
});
