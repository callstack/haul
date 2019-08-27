import { withPolyfills, makeConfig } from '../../../packages/haul-preset-0.60';
import makeBaseDllConfig from 'base-dll/makeConfig';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./host.js', {
        root: '',
        initializeCoreLocation: require.resolve('react-native/Libraries/Core/InitializeCore.js')
      }),
      dependsOn: ['base_dll'],
    },
    base_dll: makeBaseDllConfig(),
  },
});
