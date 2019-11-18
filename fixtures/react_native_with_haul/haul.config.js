import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      sourceMap: true,
    },
  },
});