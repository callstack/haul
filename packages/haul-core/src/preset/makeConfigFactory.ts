import get from 'lodash.get';
import merge from 'lodash.merge';
import webpack from 'webpack';
import path from 'path';
import { cpus } from 'os';
import isCi from 'is-ci';
import RamBundlePlugin from '@haul-bundler/ram-bundle-webpack-plugin';
import BasicBundleWebpackPlugin from '@haul-bundler/basic-bundle-webpack-plugin';
import {
  Runtime,
  EnvOptions,
  BundleConfig,
  BundleConfigBuilder,
  ProjectConfig,
  NormalizedProjectConfig,
  NormalizedProjectConfigBuilder,
  DEFAULT_PORT,
  NormalizedBundleConfig,
} from '../';
import getSourceMapPlugin from './utils/getSourceMapPlugin';
import {
  NormalizedFeaturesConfig,
  NormalizedServerConfig,
  NormalizedTemplatesConfig,
} from '../config/types';
import applySingleBundleTweaks from './utils/applySingleBundleTweaks';
import applyMultiBundleTweaks from './utils/applyMultiBundleTweaks';
import LooseModeWebpackPlugin from '../webpack/plugins/LooseModeWebpackPlugin';
import InitCoreDllPlugin from '../webpack/plugins/InitCoreDllPlugin';

type GetDefaultConfig = (
  runtime: Runtime,
  env: EnvOptions,
  bundleName: string,
  normalizedProjectConfig: NormalizedProjectConfig
) => webpack.Configuration;

const defaultTemplateConfig: NormalizedTemplatesConfig = {
  filename: {
    ios: '[bundleName].jsbundle',
    android: '[bundleName].[platform].bundle',
    __server__: '[bundleName].[platform].bundle',
  },
};

const defaultFeaturesConfig: NormalizedFeaturesConfig = {
  multiBundle: 1,
};

export default function makeConfigFactory(getDefaultConfig: GetDefaultConfig) {
  return function makeConfig(
    projectConfig: ProjectConfig
  ): NormalizedProjectConfigBuilder {
    return (runtime: Runtime, env: EnvOptions) => {
      const normalizedServerConfig = {
        port: env.port || get(projectConfig, 'server.port', DEFAULT_PORT),
        host: get(projectConfig, 'server.host', 'localhost'),
      } as NormalizedServerConfig;

      const normalizedTemplatesConfig = merge(
        {},
        defaultTemplateConfig,
        projectConfig.templates
      ) as NormalizedTemplatesConfig;

      const featuresConfig = merge(
        {},
        defaultFeaturesConfig,
        projectConfig.features
      ) as NormalizedFeaturesConfig;

      const platforms = projectConfig.platforms || ['ios', 'android'];

      const normalizedBundleConfigs: {
        [bundleName: string]: NormalizedBundleConfig;
      } = {};
      const transforms: {
        [bundleName: string]: BundleConfig['transform'];
      } = {};
      const webpackConfigs: {
        [bundleName: string]: webpack.Configuration;
      } = {};

      Object.keys(projectConfig.bundles).forEach(bundleName => {
        const bundleConfigBuilder: BundleConfig | BundleConfigBuilder =
          projectConfig.bundles[bundleName];
        const bundleConfig: BundleConfig =
          typeof bundleConfigBuilder === 'function'
            ? bundleConfigBuilder(env, runtime)
            : bundleConfigBuilder;

        let looseMode: NormalizedBundleConfig['looseMode'] = () => false;
        if (bundleConfig.looseMode === true) {
          looseMode = () => true;
        } else if (Array.isArray(bundleConfig.looseMode)) {
          looseMode = (filename: string) => {
            return (bundleConfig.looseMode as Array<string | RegExp>).some(
              element => {
                if (typeof element === 'string') {
                  if (!path.isAbsolute(element)) {
                    throw new Error(
                      `${element} in 'looseMode' property must be an absolute path or regex`
                    );
                  }
                  return element === filename;
                }

                return element.test(filename);
              }
            );
          };
        } else if (typeof bundleConfig.looseMode === 'function') {
          looseMode = bundleConfig.looseMode;
        }

        // TODO: use minifyOptions to configure terser for basic bundle
        const dev = bundleConfig.dev || env.dev;
        const root = bundleConfig.root || env.root;
        const normalizedBundleConfig: NormalizedBundleConfig = {
          name: bundleConfig.name || bundleName,
          entry:
            typeof bundleConfig.entry === 'string'
              ? { entryFiles: [bundleConfig.entry], setupFiles: [] }
              : Array.isArray(bundleConfig.entry)
              ? {
                  entryFiles: bundleConfig.entry,
                  setupFiles: [],
                }
              : bundleConfig.entry || { setupFiles: [], entryFiles: [] },
          type:
            // Force basic-bundle type when serving from packager server.
            env.bundleTarget === 'server'
              ? 'basic-bundle'
              : bundleConfig.type || env.bundleType || 'basic-bundle',
          platform: bundleConfig.platform || env.platform,
          root,
          dev,
          assetsDest: bundleConfig.assetsDest || env.assetsDest || '',
          minify: bundleConfig.minify || Boolean(env.minify),
          minifyOptions: bundleConfig.minifyOptions || undefined,
          sourceMap:
            typeof bundleConfig.sourceMap !== 'undefined'
              ? bundleConfig.sourceMap
              : true,
          looseMode,
          app: Boolean(bundleConfig.app),
          dll: Boolean(bundleConfig.dll),
          dependsOn: bundleConfig.dependsOn || [],
          external: bundleConfig.bundlePath
            ? {
                copyBundle: Boolean(bundleConfig.copyBundle),
                bundlePath: bundleConfig.bundlePath,
                assetsPath: bundleConfig.assetsPath
                  ? path.isAbsolute(bundleConfig.assetsPath)
                    ? bundleConfig.assetsPath
                    : path.join(
                        path.dirname(bundleConfig.bundlePath),
                        bundleConfig.assetsPath
                      )
                  : path.dirname(bundleConfig.bundlePath),
                manifestPath: bundleConfig.manifestPath,
              }
            : false,
          providesModuleNodeModules: bundleConfig.providesModuleNodeModules || [
            'react-native',
          ],
          hasteOptions: bundleConfig.hasteOptions || {},
          maxWorkers:
            bundleConfig.maxWorkers !== undefined
              ? Math.max(1, bundleConfig.maxWorkers)
              : env.maxWorkers !== undefined
              ? Math.max(1, env.maxWorkers)
              : Math.max(
                  isCi ? Math.min(cpus().length - 1, 7) : cpus().length - 1,
                  1
                ),
        };
        // Make sure user supplied manifestPath if the bundle is DLL. Otherwise, we wouldn't
        // have any info what the bundle contains.
        if (
          normalizedBundleConfig.dll &&
          normalizedBundleConfig.external &&
          !normalizedBundleConfig.external.manifestPath
        ) {
          throw new Error(
            `Missing 'manifestPath' for external DLL '${normalizedBundleConfig.name}'`
          );
        }

        // Make sure the target platform is supported. Do not run this check when target is set
        // to server, since the initial configuration loading is done with `platform` set
        // to "".
        if (
          !platforms.includes(normalizedBundleConfig.platform) &&
          env.bundleTarget !== 'server'
        ) {
          throw new Error(
            `Platform "${
              normalizedBundleConfig.platform
            }" is not supported - only: ${platforms
              .map(platform => `"${platform}"`)
              .join(', ')} are available.`
          );
        }

        normalizedBundleConfigs[
          normalizedBundleConfig.name
        ] = normalizedBundleConfig;
        transforms[normalizedBundleConfig.name] = bundleConfig.transform;
      });

      const bundleIdsMap: { [bundleName: string]: number } = Object.keys(
        normalizedBundleConfigs
      ).reduce((acc, bundleName, index) => {
        return {
          ...acc,
          [bundleName]: index,
        };
      }, {});

      Object.keys(normalizedBundleConfigs).forEach(bundleName => {
        const normalizedBundleConfig = normalizedBundleConfigs[bundleName];

        let webpackConfig = getDefaultConfig(
          runtime,
          env,
          normalizedBundleConfig.name,
          {
            server: normalizedServerConfig,
            platforms,
            templates: normalizedTemplatesConfig,
            bundles: {
              // Pass only it's own normalized bundle config
              [normalizedBundleConfig.name]: normalizedBundleConfig,
            },
            webpackConfigs: {},
          }
        );

        if (env.assetsDest) {
          webpackConfig.output!.path = path.isAbsolute(env.assetsDest)
            ? env.assetsDest
            : path.join(normalizedBundleConfig.root, env.assetsDest);
        }

        if (env.sourcemapOutput) {
          webpackConfig.output!.sourceMapFilename = path.isAbsolute(
            env.sourcemapOutput
          )
            ? path.relative(webpackConfig.output!.path!, env.sourcemapOutput)
            : path.relative(
                webpackConfig.output!.path!,
                path.join(normalizedBundleConfig.root, env.sourcemapOutput)
              );
        } else {
          webpackConfig.output!.sourceMapFilename = '[file].map';
        }

        webpackConfig.plugins = (webpackConfig.plugins || [])
          .concat(
            getSourceMapPlugin(
              normalizedBundleConfig,
              normalizedServerConfig,
              webpackConfig.output!.sourceMapFilename
            ) as webpack.Plugin
          )
          .filter(Boolean);

        webpackConfig.plugins = (webpackConfig.plugins || []).concat(
          normalizedBundleConfig.type === 'basic-bundle'
            ? new BasicBundleWebpackPlugin({
                preloadBundles:
                  featuresConfig.multiBundle === 1
                    ? normalizedBundleConfig.dependsOn
                    : [],
              })
            : new RamBundlePlugin({
                minify: normalizedBundleConfig.minify,
                minifyOptions: normalizedBundleConfig.minifyOptions,
                sourceMap: Boolean(normalizedBundleConfig.sourceMap),
                indexRamBundle:
                  normalizedBundleConfig.type === 'indexed-ram-bundle',
                singleBundleMode: env.bundleMode === 'single-bundle',
                preloadBundles:
                  featuresConfig.multiBundle === 1
                    ? normalizedBundleConfig.dependsOn
                    : [],
                maxWorkers: env.maxWorkers || normalizedBundleConfig.maxWorkers,
                bundleId:
                  featuresConfig.multiBundle === 1
                    ? bundleName
                    : bundleIdsMap[bundleName],
                bundleName,
              }),
          new webpack.DefinePlugin({
            'process.env.HAUL_BUNDLES': JSON.stringify(bundleIdsMap),
          })
        );

        webpackConfig.plugins.push(
          new LooseModeWebpackPlugin(normalizedBundleConfig.looseMode)
        );

        if (
          normalizedBundleConfig.dll &&
          normalizedBundleConfig.entry.setupFiles.length > 0 &&
          featuresConfig.multiBundle >= 2
        ) {
          webpackConfig.plugins.push(
            new InitCoreDllPlugin({
              setupFiles: normalizedBundleConfig.entry.setupFiles,
            })
          );
        }

        if (env.bundleMode === 'single-bundle') {
          applySingleBundleTweaks(
            env,
            normalizedTemplatesConfig,
            normalizedBundleConfig,
            webpackConfig
          );
        } else if (env.bundleMode === 'multi-bundle') {
          applyMultiBundleTweaks(
            env,
            normalizedTemplatesConfig,
            normalizedBundleConfig,
            webpackConfig,
            normalizedBundleConfigs
          );
        }

        const transform = transforms[bundleName];
        if (transform) {
          webpackConfig =
            transform({
              bundleName: normalizedBundleConfig.name,
              config: webpackConfig,
              env,
              runtime,
            }) || webpackConfig;
        }

        webpackConfigs[normalizedBundleConfig.name] = webpackConfig;
      });

      return {
        server: normalizedServerConfig,
        platforms,
        templates: normalizedTemplatesConfig,
        bundles: normalizedBundleConfigs,
        webpackConfigs,
      };
    };
  };
}
