import path from 'path';
import webpack from 'webpack';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import { DEFAULT_PORT } from '@haul/core-legacy/build/constants';
import AssetResolver from '@haul/core-legacy/build/resolvers/AssetResolver';
import HasteResolver from '@haul/core-legacy/build/resolvers/HasteResolver';
import moduleResolve from '@haul/core-legacy/build/utils/resolveModule';
import getBabelConfigPath from './getBabelConfigPath';

export type EnvOptions = {
  platform: string;
  root: string;
  dev: boolean;
  assetsDest?: string;
  minify?: boolean;
  bundle?: boolean;
  port?: number;
  providesModuleNodeModules?: Array<
    string | { name: string; directory: string }
  >;
  hasteOptions?: any;
  initializeCoreLocation?: string;
  hotReloading?: boolean;
};

export default function getDefaultConfig(options: EnvOptions) {
  const {
    platform,
    root,
    assetsDest,
    dev,
    minify,
    bundle,
    port,
    providesModuleNodeModules,
    hasteOptions,
    hotReloading,
  } = options;

  return {
    mode: dev ? 'development' : 'production',
    context: root,
    entry: [],
    output: {
      path: assetsDest || path.join(root),
      filename: `index.${platform}.bundle`,
      publicPath: `http://localhost:${port || DEFAULT_PORT}/`,
    },
    module: {
      rules: [
        { parser: { requireEnsure: false } },
        {
          test: /\.js$/,
          // eslint-disable-next-line no-useless-escape
          exclude: /node_modules(?!.*[\/\\](react|@react-navigation|@react-native-community|@expo|pretty-format|@haul|metro))/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                extends: getBabelConfigPath(root),
                plugins: [
                  require.resolve(
                    '@haul/core-legacy/build/utils/fixRequireIssues'
                  ),
                ].concat(
                  process.env.NODE_ENV !== 'production' && hotReloading
                    ? [
                        require.resolve('react-hot-loader/babel'),
                        require.resolve(
                          '@haul/core-legacy/build/hot/babelPlugin'
                        ),
                      ]
                    : []
                ),
                /**
                 * to improve the rebuild speeds
                 * This enables caching results in ./node_modules/.cache/babel-loader/
                 * This is a feature of `babel-loader` and not babel
                 */
                cacheDirectory: dev,
              },
            },
          ],
        },
        {
          test: AssetResolver.test,
          use: {
            /**
             * Asset loader enables asset management based on image scale
             * This needs the AssetResolver plugin in resolver.plugins to work
             */
            loader: require.resolve('../loaders/assetLoader'),
            query: { platform, root, bundle },
          },
        },
      ],
    },
    plugins: [
      /**
       * MacOS has a case insensitive filesystem
       * This is needed so we can error on incorrect case
       */
      new CaseSensitivePathsPlugin(),
      new webpack.DefinePlugin({
        /**
         * Various libraries like React rely on `process.env.NODE_ENV`
         * to distinguish between production and development
         */
        'process.env': {
          NODE_ENV: dev ? '"development"' : '"production"',
        },
        __DEV__: dev,
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: !!minify,
        debug: dev,
      }),
    ].concat(
      dev
        ? [
            ...(hotReloading ? [new webpack.HotModuleReplacementPlugin()] : []),
            new webpack.EvalSourceMapDevToolPlugin({
              module: true,
            }),
            new webpack.NamedModulesPlugin(),
            new webpack.SourceMapDevToolPlugin({
              test: /\.(js|css|(js)?bundle)($|\?)/i,
              filename: '[file].map',
            }),
            new webpack.BannerPlugin({
              banner: 'if (this && !this.self) { this.self = this; };\n',
              raw: true,
            }),
          ]
        : [
            /**
             * By default, sourcemaps are only generated with *.js files
             * We need to use the plugin to configure *.bundle (Android, iOS - development)
             * and *.jsbundle (iOS - production) to emit sourcemap
             */
            new webpack.SourceMapDevToolPlugin({
              test: /\.(js|css|(js)?bundle)($|\?)/i,
              filename: '[file].map',
            }),
          ]
    ),
    resolve: {
      alias:
        process.env.NODE_ENV === 'production'
          ? {}
          : {
              /**
               * Latest `react-proxy` version does not contain try/catches from
               * commit 981815dca250373619138c9f5aadf12295cf1b3f.
               */
              'react-proxy': '@zamotany/react-proxy',
            },
      plugins: [
        /**
         * React Native uses a module system called Haste
         * React Native uses haste internally, and additional RN
         * platform's require additional packages also provide haste modules
         */
        new HasteResolver({
          directories: (providesModuleNodeModules || ['react-native']).map(
            _ => {
              if (typeof _ === 'string') {
                if (_ === 'react-native') {
                  return path.join(
                    moduleResolve(root, 'react-native'),
                    'Libraries'
                  );
                }
                return moduleResolve(root, _);
              }
              return path.join(moduleResolve(root, _.name), _.directory);
            }
          ),
          hasteOptions: hasteOptions || {},
        }),
        /**
         * This is required by asset loader to resolve extra scales
         * It will resolve assets like image@1x.png when image.png is not present
         */
        new AssetResolver({ platform }),
      ],
      /**
       * Match what React Native packager supports
       * First entry takes precendece
       */
      mainFields: ['react-native', 'browser', 'main'],
      extensions: [`.${platform}.js`, '.native.js', '.js'],
    },
    optimization: {
      minimize: !!minify,
      minimizer: [
        // new UglifyJsPlugin({
        //   test: /\.(js|(js)?bundle)($|\?)/i,
        //   cache: true,
        //   parallel: true,
        //   sourceMap: true,
        // }),
      ],
      namedModules: dev,
      concatenateModules: true,
    },
    /**
     * Set target to webworker as it's closer to RN environment than `web`.
     */
    target: 'webworker',
    stats: 'verbose',
  };
}
