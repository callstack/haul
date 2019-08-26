import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.59";
import { join } from "path";

export default makeConfig({
  bundles: {
    base_dll: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
        './src/BundleRegistry.js'
      ]),
      dll: true,
      type: 'indexed-ram-bundle',
    },
    base_dll_server: {
      entry: withPolyfills([
        'react',
        'react-native',
        'react-navigation',
        './src/BundleRegistry.js'
      ]),
      dll: true,
    },
  },
});
