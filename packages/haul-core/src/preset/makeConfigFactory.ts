import get from 'lodash.get';
import merge from 'lodash.merge';
import webpack from 'webpack';
import path from 'path';
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
  NormalizedServerConfig,
  NormalizedTemplatesConfig,
} from '../config/types';
import applySingleBundleTweaks from './utils/applySingleBundleTweaks';
import applyMultiBundleTweaks from './utils/applyMultiBundleTweaks';
import getBundlePlugin from './utils/getBundlePlugin';

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

      const platforms = projectConfig.platforms || ['ios', 'android'];

      const normalizedBundleConfigs: {
        [bundleName: string]: NormalizedBundleConfig;
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

        // TODO: use minifyOptions to configure terser for basic bundle
        const dev = bundleConfig.dev || env.dev;
        const root = bundleConfig.root || env.root;
        const normalizedBundleConfig = {
          name: bundleConfig.name || bundleName,
          entry:
            typeof bundleConfig.entry === 'string'
              ? [bundleConfig.entry]
              : bundleConfig.entry,
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
          app: Boolean(bundleConfig.app),
          dll: Boolean(bundleConfig.dll),
          dependsOn: bundleConfig.dependsOn || [],
          providesModuleNodeModules: bundleConfig.providesModuleNodeModules || [
            'react-native',
          ],
          hasteOptions: bundleConfig.hasteOptions || {},
        };

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
        }

        webpackConfig.plugins = (webpackConfig.plugins || [])
          .concat(getSourceMapPlugin(
            normalizedBundleConfig,
            normalizedServerConfig
          ) as webpack.Plugin)
          .filter(Boolean);

        webpackConfig.plugins = (webpackConfig.plugins || []).concat(
          getBundlePlugin(env, normalizedBundleConfig)
        );

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
            webpackConfig
          );
        }

        const { transform } = bundleConfig;
        if (transform) {
          webpackConfig =
            transform({
              bundleName: normalizedBundleConfig.name,
              config: webpackConfig,
              env,
              runtime,
            }) || webpackConfig;
        }

        normalizedBundleConfigs[
          normalizedBundleConfig.name
        ] = normalizedBundleConfig;
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
