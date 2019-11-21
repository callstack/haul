import { withPolyfills, makeConfig } from '../../../../packages/haul-preset-0.59';
import makeBaseDllConfig from 'base-dll/makeConfig';

export default makeConfig({
  bundles: {
    base_dll: makeBaseDllConfig(),
    app0: {
      entry: './App',
      dependsOn: ['base_dll'],
      app: true,
    }
  },
});
