import { withPolyfills, makeConfig } from '../../../packages/haul-preset-0.60';
import makeBaseDllConfig from 'base-dll/makeConfig';
import { join } from 'path';

export default makeConfig({
  bundles: {
    index:  ({ platform, dev }) => {
      const basePath = join(
        __dirname,
        `../node_modules/host/dist/${platform}/${dev ? 'dev' : 'prod'}`
      );
      const filename = `index${
        platform === 'ios' ? '.jsbundle' : '.android.bundle'
      }`;
      return {
        bundlePath: join(basePath, filename),
      };
    },
    base_dll: makeBaseDllConfig(),
    app0: {
      entry: './App',
      dependsOn: ['base_dll'],
      app: true,
    }
  },
});
