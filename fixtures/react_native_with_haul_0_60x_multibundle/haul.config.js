import { withPolyfills, makeConfig } from '../../packages/haul-preset-0.60';
import { NormalModuleReplacementPlugin } from 'webpack';
import { join } from 'path';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index'),
      type: 'indexed-ram-bundle',
    },
  },
});