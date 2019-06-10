import path from 'path';
import webpack from 'webpack';
import {
  getProjectConfigPath,
  getProjectConfig,
  getWebpackConfig,
  Runtime,
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
};

export default function prepareWebpackConfig(
  runtime: Runtime,
  options: Options
): webpack.Configuration {
  // TODO: figure out a better way to read and transpile user files on-demand
  require('@haul-bundler/core-legacy/build/babelRegister');

  const directory = process.cwd();
  const configPath = getProjectConfigPath(directory, options.config);
  const projectConfig = getProjectConfig(configPath);
  const webpackConfig = getWebpackConfig(
    runtime,
    {
      platform: options.platform,
      root: directory,
      dev: options.dev,
      minify: options.minify === undefined ? !options.dev : options.minify,
      bundle: true,
      assetsDest: options.assetsDest,
    },
    projectConfig
  );

  if (options.assetsDest) {
    webpackConfig.output!.path = path.isAbsolute(options.assetsDest)
      ? options.assetsDest
      : path.join(directory, options.assetsDest);
  }

  if (options.bundleOutput) {
    webpackConfig.output!.filename = path.isAbsolute(options.bundleOutput)
      ? path.relative(webpackConfig.output!.path!, options.bundleOutput)
      : path.relative(
          webpackConfig.output!.path!,
          path.join(directory, options.bundleOutput)
        );
  }

  if (options.sourcemapOutput) {
    webpackConfig.output!.sourceMapFilename = path.isAbsolute(
      options.sourcemapOutput
    )
      ? path.relative(webpackConfig.output!.path!, options.sourcemapOutput)
      : path.relative(
          webpackConfig.output!.path!,
          path.join(directory, options.sourcemapOutput)
        );
  }

  // Attach progress plugin
  if (options.progress !== 'none') {
    webpackConfig.plugins!.push(new SimpleProgressWebpackPlugin({
      format: options.progress,
    }) as webpack.Plugin);
  }

  return webpackConfig;
}
