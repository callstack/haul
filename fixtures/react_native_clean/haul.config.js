import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index'),
    },
  },
});