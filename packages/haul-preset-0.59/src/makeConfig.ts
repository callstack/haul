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
} from '@haul-bundler/core';
import RamBundlePlugin from '@haul-bundler/ram-bundle-webpack-plugin';
import BasicBundleWebpackPlugin from '@haul-bundler/basic-bundle-webpack-plugin';
import get from 'lodash.get';
import webpack from 'webpack';
import path from 'path';
import getDefaultConfig from './defaultConfig';

function makeAbsolute(
  root: string,
  value: string | string[]
): string | string[] {
  const resolve = (v: string): string =>
    path.isAbsolute(v) ? v : path.join(root, v);

  if (typeof value === 'string') {
    return resolve(value);
  }

  return value.map(item => resolve(item));
}

export default function makeConfig(
  projectConfig: ProjectConfig
): NormalizedProjectConfigBuilder {
  return (runtime: Runtime, env: EnvOptions) => {
    const normalizedServerConfig = {
      port: get(projectConfig, 'server.port', DEFAULT_PORT),
      host: get(projectConfig, 'server.host', 'localhost'),
    };

    const normalizedBundleConfigs: {
      [bundleName: string]: NormalizedBundleConfig;
    } = {};
    const webpackConfigs: { [bundleName: string]: webpack.Configuration } = {};

    Object.keys(projectConfig.bundles).forEach(bundleName => {
      const bundleConfigBuilder: BundleConfig | BundleConfigBuilder =
        projectConfig.bundles[bundleName];
      const bundleConfig: BundleConfig =
        typeof bundleConfigBuilder === 'function'
          ? bundleConfigBuilder(env)
          : bundleConfigBuilder;

      // TODO: add `dll: boolean` flag and push DllPlugin
      // TODO: use dllDependencies and push DllReferencePlugin
      // TODO: use `library` and `libraryTarget` options when necessary
      const normalizedBundleConfig = {
        entry: bundleConfig.entry,
        type: bundleConfig.type || env.bundleType || 'basic-bundle',
        platform: bundleConfig.platform || env.platform,
        root: bundleConfig.root || env.root,
        dev: bundleConfig.dev || env.dev,
        assetsDest: bundleConfig.assetsDest || env.assetsDest || '',
        minify: bundleConfig.minify || Boolean(env.minify),
        minifyOptions: bundleConfig.minifyOptions || undefined,
        sourceMap: bundleConfig.sourceMap || false,
        dllDependencies: bundleConfig.dllDependencies || [],
        providesModuleNodeModules: bundleConfig.providesModuleNodeModules || [
          'react-native',
        ],
        hasteOptions: bundleConfig.hasteOptions || {},
      };

      // Make sure all entries are absolute.
      normalizedBundleConfig.entry = makeAbsolute(
        normalizedBundleConfig.root,
        normalizedBundleConfig.entry
      );

      let webpackConfig = getDefaultConfig(runtime, normalizedBundleConfig, {
        bundle: Boolean(env.bundle),
        ...normalizedServerConfig,
      });

      // Tweak bundle when creating static bundle
      if (env.bundle && normalizedBundleConfig.type === 'basic-bundle') {
        (webpackConfig.plugins as webpack.Plugin[]).push(
          new BasicBundleWebpackPlugin(
            Boolean(env.bundle),
            Boolean(normalizedBundleConfig.sourceMap)
          )
        );
      } else if (env.bundle) {
        (webpackConfig.plugins as webpack.Plugin[]).push(
          new RamBundlePlugin({
            minify: normalizedBundleConfig.minify,
            minifyOptions: normalizedBundleConfig.minifyOptions,
            sourceMap: Boolean(normalizedBundleConfig.sourceMap),
            indexRamBundle:
              normalizedBundleConfig.type === 'indexed-ram-bundle',
            singleBundleMode: env.singleBundleMode,
          })
        );
      }

      if (env.assetsDest) {
        webpackConfig.output!.path = path.isAbsolute(env.assetsDest)
          ? env.assetsDest
          : path.join(normalizedBundleConfig.root, env.assetsDest);
      }

      if (env.bundleOutput) {
        webpackConfig.output!.filename = path.isAbsolute(env.bundleOutput)
          ? path.relative(webpackConfig.output!.path!, env.bundleOutput)
          : path.relative(
              webpackConfig.output!.path!,
              path.join(normalizedBundleConfig.root, env.bundleOutput)
            );
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

      const { transform } = bundleConfig;
      if (transform) {
        webpackConfig = transform({
          bundleName,
          config: webpackConfig,
          env,
          runtime,
        });
      }

      normalizedBundleConfigs[bundleName] = normalizedBundleConfig;
      webpackConfigs[bundleName] = webpackConfig;
    });

    return {
      server: normalizedServerConfig,
      bundles: normalizedBundleConfigs,
      webpackConfigs,
    } as NormalizedProjectConfig;
  };
}
