import { withPolyfills, makeConfig } from '../../../packages/haul-preset-0.60';
import { join } from 'path';

const entry = withPolyfills([
  require.resolve('react'),
  require.resolve('react-native'),
  require.resolve('react-navigation'),
  './BundleRegistry.js'
]);

export default makeConfig({
  bundles: {
    base_dll: {
      entry,
      dll: true,
      type: 'indexed-ram-bundle',
    },
    // Bundle for packager server, compiled as basic-bundle (aka plain javascript)
    // since RAM bundles are only supported when building static bundles.
    base_dll_server: {
      entry,
      dll: true,
      transform: ({ config }) => {
        // Overwrite `output.library`, so that it will be available under `base_dll`,
        //  instead of (by default) `base_dll_server`.
        config.output.library = 'base_dll';
      }
    },
  },
});
