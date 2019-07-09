import webpack from 'webpack';
import RamBundlePlugin from '@haul-bundler/ram-bundle-webpack-plugin';
import BasicBundleWebpackPlugin from '@haul-bundler/basic-bundle-webpack-plugin';
import { EnvOptions, NormalizedBundleConfig } from '../../config/types';

export default function getBundlePlugin(
  env: EnvOptions,
  bundleConfig: NormalizedBundleConfig
): webpack.Plugin {
  if (bundleConfig.type === 'basic-bundle') {
    return new BasicBundleWebpackPlugin({
      bundle: Boolean(env.bundleTarget === 'file'),
      sourceMap: Boolean(bundleConfig.sourceMap),
      preloadBundles: bundleConfig.dependsOn,
    });
  } else {
    return new RamBundlePlugin({
      minify: bundleConfig.minify,
      minifyOptions: bundleConfig.minifyOptions,
      sourceMap: Boolean(bundleConfig.sourceMap),
      indexRamBundle: bundleConfig.type === 'indexed-ram-bundle',
      singleBundleMode: env.bundleMode === 'single-bundle',
      preloadBundles: bundleConfig.dependsOn,
    });
  }
}
