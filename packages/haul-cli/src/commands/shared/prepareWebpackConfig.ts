import webpack from 'webpack';
import {
  Configuration,
  Runtime,
  EnvOptions,
  ExternalBundle,
} from '@haul-bundler/core';
import SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';

export type Options = {
  config?: string;
  dev: boolean;
  minify?: boolean;
  platform: string;
  assetsDest?: string;
  bundleOutput?: string;
  sourcemapOutput?: string;
  progress: string;
  bundleType?: EnvOptions['bundleType'];
  bundleMode: EnvOptions['bundleMode'];
  maxWorkers?: number;
};

export default function prepareWebpackConfig(
  runtime: Runtime,
  options: Options
): webpack.Configuration {
  const directory = process.cwd();
  const configuration = Configuration.getLoader(
    runtime,
    directory,
    options.config
  ).load({
    platform: options.platform,
    root: directory,
    dev: options.dev,
    bundleType: options.bundleType,
    bundleMode: options.bundleMode,
    bundleTarget: 'file',
    assetsDest: options.assetsDest,
    bundleOutput: options.bundleOutput,
    sourcemapOutput: options.sourcemapOutput,
    minify: options.minify === undefined ? !options.dev : options.minify,
    maxWorkers: options.maxWorkers,
  });

  const bundle = configuration
    .createBundles(runtime)
    .find(bundle => bundle.name === 'index' || bundle.name === 'main');

  if (!bundle) {
    throw new Error(
      'Cannot find Webpack config `index` nor `main`. Make sure you have bundle config for `index` or `main'
    );
  }

  if (bundle instanceof ExternalBundle) {
    throw new Error('External bundles are not supported for this command');
  }

  const webpackConfig = bundle.makeWebpackConfig();
  // Attach progress plugin
  if (options.progress !== 'none') {
    webpackConfig.plugins!.push(
      new SimpleProgressWebpackPlugin({
        format: options.progress,
      }) as webpack.Plugin
    );
  }

  return webpackConfig;
}
