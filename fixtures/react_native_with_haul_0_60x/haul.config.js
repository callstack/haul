import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.60";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
    },
  },
});