import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.60';
import { NormalModuleReplacementPlugin } from 'webpack';
import path from 'path';

export default makeConfig({
  platforms: ['windows'],
  bundles: {
    index: {
      entry: withPolyfills('./index.windows.js', {
        initializeCoreLocation: 'node_modules/react-native-windows/Libraries/Core/InitializeCore.js'
      }),
      providesModuleNodeModules: ['react-native', 'react-native-windows'],
      hasteOptions: { platforms: ['native', 'windows'] },
      transform({ config }) {
        config.resolve.alias = {
          ...config.resolve.alias,
          'react-native': 'react-native-windows'
        };

        // react-navigation imports and initialises native modules only available on iOS/Android,
        // so we stub it with minimal working implementation.
        config.plugins.push(
          new NormalModuleReplacementPlugin(/react-navigation/, path.join(__dirname, 'react-navigation-stub.js'))
        );
      }
    },
  },
});