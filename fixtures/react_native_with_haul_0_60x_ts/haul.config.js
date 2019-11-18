import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.60";

export default makeConfig({
  server: {
    port: 8000
  },
  bundles: {
    index: {
      entry: withPolyfills('./index'),
    },
  },
});