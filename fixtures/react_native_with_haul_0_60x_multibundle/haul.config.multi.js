import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.60';

export default makeConfig({
  templates: {
    filename: {
      ios: '[bundleName].ios.bundle',
    },
  },
  features: {
    multiBundle: 2,
  },
  bundles: {
    // index: {
    //   entry: withPolyfills('./index'),
    //   // type: 'indexed-ram-bundle',
    // },
    // host: {
    //   entry: withPolyfills('./src/host.js'),
    //   dependsOn: ['index'],
    // },
    index: {
      entry: withPolyfills(['react', 'react-native', 'react-navigation']),
      dll: true,
      type: 'indexed-ram-bundle',
    },
    // app0: {
    //   entry: './src/app0',
    //   type: 'basic-bundle',
    //   dependsOn: ['index'],
    //   app: true,
    // },
    // app1: {
    //   entry: './src/app1',
    //   type: 'basic-bundle',
    //   dependsOn: ['index'],
    //   app: true,
    // },
  },
});
