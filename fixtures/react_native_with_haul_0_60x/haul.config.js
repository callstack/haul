import { withPolyfills, makeConfig } from "../../packages/haul-preset-0.60";
import path from 'path';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      transform({ config }) {
        config.module.rules.push({
          test: /\.[j|t]sx?$/,
          use: 'source-map-loader',
          enforce: 'pre',
        });
        config.resolve = {
          ...config.resolve,
          modules: [
            ...(config.resolve.modules || []),
            path.join(__dirname, './node_modules'),
            path.join(__dirname, '../node_modules'),
            path.join(__dirname, '../node_modules/foo/node_modules'),
          ]
        };
        config.module.rules.push(
          {
            test: /\.[jt]sx?$/,
            include: [
              path.join(__dirname, '../node_modules/foo'),
              path.join(__dirname, '../node_modules/foo/node_modules/bar'),
              path.join(__dirname, '../node_modules/baz')
            ],
            use: [
              {
                loader: 'babel-loader',
                options: {
                  extends: require.resolve('./babel.config.js'),
                  plugins: [
                    require.resolve(
                      '../../packages/haul-core/build/utils/fixRequireIssues'
                    ),
                  ],
                  cacheDirectory: false,
                },
              },
            ],
          },
        )
      }
    },
  },
});