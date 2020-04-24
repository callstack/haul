import { withPolyfills, makeConfig } from '../../../packages/haul-preset-0.60';
import makeBaseDllConfig from 'base-dll/makeConfig';
import { join } from 'path';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./host.js'),
      dependsOn: ['base_dll'],
    },
    base_dll: makeBaseDllConfig(true), // copy bundle files
    app0: ({ platform, dev }) => {
      const basePath = join(
        __dirname,
        `node_modules/app0/dist/${platform}/${dev ? 'dev' : 'prod'}`
      );
      const filename = `app0${
        platform === 'ios' ? '.jsbundle' : '.android.bundle'
      }`;
      return {
        bundlePath: join(basePath, filename),
        copyBundle: true,
      };
    },
  },
});
