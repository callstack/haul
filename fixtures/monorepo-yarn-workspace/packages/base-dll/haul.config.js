import { withPolyfills, makeConfig } from '../../../../packages/haul-preset-0.59';
import { join } from 'path';

const entry = withPolyfills([
  require.resolve('react'),
  require.resolve('react-native'),
  require.resolve('react-navigation'),
]);

export default makeConfig({
  bundles: {
    base_dll: ({ dev }) => ({
      entry,
      dll: true,
      type: dev ? 'basic-bundle' : 'indexed-ram-bundle',
    }),
  },
});
