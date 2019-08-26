import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.59";
import { join } from "path";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./src/host.js'),
      dependsOn: ['base_dll'],
    },
    base_dll: ({ platform }) => ({
      dll: true,
      copyBundle: true,
      bundlePath: join(
        __dirname,
        `../node_modules/external-base-dll/${platform}/${
          platform === 'ios' ? 'base_dll.jsbundle' : 'base_dll.android.bundle'
        }`
      ),
      manifestPath: join(__dirname, `../node_modules/external-base-dll/${platform}/base_dll.manifest.json`),
    }),
    app0: {
      entry: './src/app0',
      dependsOn: ['base_dll'],
      app: true,
    },
    app1: {
      entry: './src/app1',
      dependsOn: ['base_dll'],
      app: true,
    }
  },
});
