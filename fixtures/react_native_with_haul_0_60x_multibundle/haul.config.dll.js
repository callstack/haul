import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.60';
import { join } from 'path';

export default makeConfig({
  bundles: {
    base_dll: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
      ]),
      dll: true,
      type: 'indexed-ram-bundle',
    },
    base_dll_server: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
      ]),
      dll: true,
      transform: ({ config }) => {
        config.output.library = 'base_dll';
      }
    },
  },
});
