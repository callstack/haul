import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.60';

export default makeConfig({
  templates: {
    filename: {
      ios: '[bundleName].ios.bundle'
    },
  },
  bundles: {
    host: {
      entry: withPolyfills('./src/host.js'),
      dependsOn: ['base_dll'],
    },
    base_dll: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
      ]),
      dll: true,
      type: 'indexed-ram-bundle',
    },
    app0: {
      entry: './src/app0',
      type: 'indexed-ram-bundle',
      dependsOn: ['base_dll'],
      app: true,
    },
    app1: {
      entry: './src/app1',
      type: 'indexed-ram-bundle',
      dependsOn: ['base_dll'],
      app: true,
    }
  },
});
