import {
  AssetResolver,
  HasteResolver,
  ASSET_LOADER_PATH,
  resolveModule,
  Runtime,
  NormalizedBundleConfig,
} from '@haul-bundler/core';
import path from 'path';
import os from 'os';
import isCi from 'is-ci';
import webpack from 'webpack';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import getBabelConfigPath from './getBabelConfigPath';

export default function getDefaultConfig(
  runtime: Runtime,
  bundleConfig: NormalizedBundleConfig,
  { bundle, port, host }: { bundle: boolean; port: number; host: string }
): webpack.Configuration {
  const {
    entry,
    platform,
    root,
    assetsDest,
    dev,
    minify,
    providesModuleNodeModules,
    hasteOptions,
    sourceMap,
  } = bundleConfig;
  return {
    mode: dev ? 'development' : 'production',
    context: root,
    devtool: false,
    entry,
    output: {
      path: assetsDest || path.join(root),
      filename: `index.${platform}.bundle`,
      publicPath: `http://${host}:${port}/`,
      globalObject: 'this',
    },
    module: {
      rules: [
        { parser: { requireEnsure: false } },
        {
          test: /\.js$/,
          // eslint-disable-next-line no-useless-escape
          exclude: /node_modules(?!.*[\/\\](react|@react-navigation|@react-native-community|@expo|pretty-format|@haul-bundler|metro))/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                extends: getBabelConfigPath(root),
                plugins: [
                  require.resolve(
                    '@haul-bundler/core-legacy/build/utils/fixRequireIssues'
                  ),
                ],
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
            loader: ASSET_LOADER_PATH,
            options: {
              runtime,
              platform,
              root,
              bundle,
            },
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
    ]
      .concat(
        sourceMap && dev
          ? [
              new webpack[
                sourceMap === 'inline'
                  ? 'EvalSourceMapDevToolPlugin'
                  : 'SourceMapDevToolPlugin'
              ]({
                test: /\.(js|css|(js)?bundle)($|\?)/i,
                filename: '[file].map',
                publicPath: `http://${host}:${port}/`,
                moduleFilenameTemplate: '[absolute-resource-path]',
                module: true,
              } as any),
            ]
          : []
      )
      .concat(
        sourceMap && !dev
          ? [
              /**
               * By default, sourcemaps are only generated with *.js files
               * We need to use the plugin to configure *.bundle (Android, iOS - development)
               * and *.jsbundle (iOS - production) to emit sourcemap
               */
              new webpack.SourceMapDevToolPlugin({
                test: /\.(js|css|(js)?bundle)($|\?)/i,
                filename: '[file].map',
                moduleFilenameTemplate: '[absolute-resource-path]',
                module: true,
              }),
            ]
          : []
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
            (_: any) => {
              if (typeof _ === 'string') {
                if (_ === 'react-native') {
                  return path.join(
                    resolveModule(root, 'react-native'),
                    'Libraries'
                  );
                }
                return resolveModule(root, _);
              }
              return path.join(resolveModule(root, _.name), _.directory);
            }
          ),
          hasteOptions: hasteOptions || {},
        }),
        /**
         * This is required by asset loader to resolve extra scales
         * It will resolve assets like image@1x.png when image.png is not present
         */
        new AssetResolver({ platform, runtime }),
      ],
      /**
       * Match what React Native packager supports.
       * First entry takes precedence.
       */
      mainFields: ['react-native', 'browser', 'main'],
      extensions: [`.${platform}.js`, '.native.js', '.js'],
    },
    optimization: {
      minimize: !!minify,
      minimizer: [
        new TerserWebpackPlugin({
          test: /\.(js|(js)?bundle)($|\?)/i,
          cache: true,
          // Set upper limit on CPU cores, to prevent Out of Memory exception on CIs.
          parallel: isCi ? Math.max(os.cpus().length, 8) - 1 : true,
          sourceMap: true,
        }),
      ],
      namedModules: dev,
      concatenateModules: true,
    },
    // Webworker environment is the closes to RN's except for `importScripts`. Further customization
    // of the generated bundle can be done in `basic-bundle` or `ram-bundle` Webpack plugin.
    target: 'webworker',
    stats: 'verbose',
  };
}
