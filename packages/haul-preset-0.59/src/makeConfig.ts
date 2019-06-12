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

      // TODO: use minifyOptions to configure terser for basic bundle
      const dev = bundleConfig.dev || env.dev;
      const root = bundleConfig.root || env.root;
      const normalizedBundleConfig = {
        entry:
          typeof bundleConfig.entry === 'string'
            ? [bundleConfig.entry]
            : bundleConfig.entry,
        type: bundleConfig.type || env.bundleType || 'basic-bundle',
        platform: bundleConfig.platform || env.platform,
        root,
        dev,
        assetsDest: bundleConfig.assetsDest || env.assetsDest || '',
        minify: bundleConfig.minify || Boolean(env.minify),
        minifyOptions: bundleConfig.minifyOptions || undefined,
        sourceMap: bundleConfig.sourceMap || !dev,
        dll: Boolean(bundleConfig.dll),
        dllDependencies: bundleConfig.dllDependencies || [],
        providesModuleNodeModules: bundleConfig.providesModuleNodeModules || [
          'react-native',
        ],
        hasteOptions: bundleConfig.hasteOptions || {},
      };

      let webpackConfig = getDefaultConfig(runtime, normalizedBundleConfig, {
        bundle: Boolean(env.bundle),
        ...normalizedServerConfig,
      });

      // Tweak bundle when creating static bundle
      if (env.bundle && normalizedBundleConfig.type === 'basic-bundle') {
        (webpackConfig.plugins as webpack.Plugin[]).push(
          new BasicBundleWebpackPlugin(
            Boolean(env.bundle),
            Boolean(normalizedBundleConfig.sourceMap),
            normalizedBundleConfig.dllDependencies
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
            preloadBundles: normalizedBundleConfig.dllDependencies,
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

      if (!webpackConfig.output!.filename) {
        if (env.singleBundleMode) {
          webpackConfig.output!.filename = `index.${
            normalizedBundleConfig.platform
          }.bundle`;
        } else {
          webpackConfig.output!.filename = `${bundleName}.${
            normalizedBundleConfig.platform
          }.bundle`;
        }
      }

      if (normalizedBundleConfig.dll) {
        webpackConfig.output!.library = bundleName;
        webpackConfig.output!.libraryTarget = 'this';
        webpackConfig.plugins!.push(
          new webpack.DllPlugin({
            name: bundleName,
            path: path.join(
              webpackConfig.output!.path!,
              `${bundleName}.manifest.json`
            ),
          })
        );
      }

      normalizedBundleConfig.dllDependencies.forEach(
        (dllBundleName: string) => {
          webpackConfig.plugins!.push(
            new webpack.DllReferencePlugin({
              context: normalizedBundleConfig.root,
              manifest: path.join(
                webpackConfig.output!.path!,
                `${dllBundleName}.manifest.json`
              ),
              sourceType: 'this',
            })
          );
        }
      );

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
