import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.59';
import { NormalModuleReplacementPlugin } from 'webpack';
import { join } from 'path';

export default makeConfig({
  platforms: ['windows'],
  bundles: {
    index: {
      entry: withPolyfills('./index'),
      providesModuleNodeModules: ['react-native', 'react-native-windows'],
      hasteOptions: { platforms: ['native', 'windows'] },
      type: 'indexed-ram-bundle',
    },
  },
});