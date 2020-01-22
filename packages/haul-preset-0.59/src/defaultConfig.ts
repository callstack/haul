import {
  AssetResolver,
  HasteResolver,
  getBabelConfigPath,
  resolveModule,
  ASSET_LOADER_PATH,
  Runtime,
  EnvOptions,
  NormalizedProjectConfig,
} from '@haul-bundler/core';
import path from 'path';
import os from 'os';
import isCi from 'is-ci';
import webpack from 'webpack';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';

export default function getDefaultConfig(
  runtime: Runtime,
  env: EnvOptions,
  bundleName: string,
  projectConfig: NormalizedProjectConfig
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
  } = projectConfig.bundles[bundleName];
  const { host, port } = projectConfig.server;

  return {
    mode: dev ? 'development' : 'production',
    context: root,
    devtool: false,
    entry,
    output: {
      path: assetsDest || root,
      publicPath: `http://${host}:${port}/`,
      globalObject: 'this',
    },
    module: {
      rules: [
        { parser: { requireEnsure: false } },
        {
          test: /\.[jt]sx?$/,
          // eslint-disable-next-line no-useless-escape
          exclude: /node_modules(?!.*[\/\\](react|@react-navigation|@react-native-community|@expo|pretty-format|@haul-bundler|metro))/,
          use: [
            {
              // loader: require.resolve('babel-loader'),
              loader: require.resolve('@haul-bundler/core/build/webpack/loaders/babelWorkerLoader'),
              options: {
                maxWorkers: 8,
                extends: getBabelConfigPath(root),
                plugins: [
                  require.resolve(
                    '@haul-bundler/core/build/utils/fixRequireIssues'
                  ),
                ],
                /**
                 * to improve the rebuild speeds
                 * This enables caching results in ./node_modules/.cache/babel-loader//<platform>
                 * This is a feature of `babel-loader` and not babel
                 */
                cacheDirectory: dev
                  ? path.join(
                      root,
                      'node_modules',
                      '.cache',
                      'babel-loader',
                      platform
                    )
                  : false,
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
              bundle: env.bundleTarget === 'file',
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
      new CaseSensitivePathsPlugin() as webpack.Plugin,
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
      // new webpack.debug.ProfilingPlugin({outputPath: path.resolve('./events_no_progress.json')})
    ],
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
          directories: providesModuleNodeModules.map((_: any) => {
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
          }),
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
      aliasFields: ['react-native', 'browser', 'main'],
      extensions: [
        `.${platform}.js`,
        `.${platform}.jsx`,
        '.native.js',
        '.native.jsx',
        '.js',
        '.jsx',
        `.${platform}.ts`,
        `.${platform}.tsx`,
        '.native.ts',
        '.native.tsx',
        '.ts',
        '.tsx',
      ],
    },
    optimization: {
      minimize: !!minify,
      minimizer: [
        new TerserWebpackPlugin({
          test: /\.(js|(js)?bundle)($|\?)/i,
          cache: true,
          // Set upper limit on CPU cores, to prevent Out of Memory exception on CIs.
          parallel: isCi ? Math.min(os.cpus().length, 8) - 1 : true,
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
