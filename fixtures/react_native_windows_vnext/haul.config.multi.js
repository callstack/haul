import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.59';
import { NormalModuleReplacementPlugin } from 'webpack';
import { join } from 'path';

const common = {
  providesModuleNodeModules: ['react-native', 'react-native-windows'],
  hasteOptions: { platforms: ['native', 'windows'] },
}

export default makeConfig({
  templates: {
    filename: {
      windows: '[bundleName].[platform].bundle'
    }
  },
  platforms: ['windows'],
  bundles: {
    host: {
      entry: withPolyfills('./src/host.js'),
      dependsOn: ['base_dll'],
      ...common
    },
    base_dll: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
        'apollo-client',
        'apollo-link-http',
        'apollo-cache-inmemory',
        'react-apollo',
        'graphql-tag',
        'graphql'
      ]),
      dll: true,
      type: 'indexed-ram-bundle',
      ...common
    },
    app0: {
      entry: './src/app0',
      type: 'indexed-ram-bundle',
      app: true,
      dependsOn: ['base_dll'],
      ...common
    },
    app1: {
      entry: './src/app1',
      type: 'indexed-ram-bundle',
      app: true,
      dependsOn: ['base_dll'],
      ...common
    },
  },
});