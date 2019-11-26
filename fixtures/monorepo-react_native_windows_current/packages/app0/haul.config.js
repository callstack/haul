import { withPolyfills, makeConfig } from '../../../../packages/haul-preset-0.59';

const PLATFORM_COMMON = {
  platform: 'windows',
  providesModuleNodeModules: ['react-native', 'react-native-windows'],
  hasteOptions: { platforms: ['native', 'windows'] },
};

export default makeConfig({
  server: { host: '0.0.0.0' },
  platforms: ['windows'],
  bundles: {
    index: {
      entry:  withPolyfills('./App'),
      sourceMap: true,
      ...PLATFORM_COMMON,
      transform: ({ config }) => {
        // config.plugins.push(new DuplicatePackageChecker());
        return config;
      },
    }
  },
});
