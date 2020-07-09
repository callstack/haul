export type Mode = 'dev' | 'prod' | 'development' | 'production';
export type SourceMap = boolean | 'inline';
import webpack from 'webpack';
import Runtime from './runtime/Runtime';

export type BundlingMode = 'single-bundle' | 'multi-bundle';
export type RamBundleType = 'indexed-ram-bundle' | 'file-ram-bundle';
export type BundleFormat = 'basic-bundle' | RamBundleType;
export type BundleType = 'dll' | 'app' | 'default';
export type BundleOutputType = 'file' | 'server';
export type LooseModeConfig =
  | boolean
  | Array<string | RegExp>
  | ((filename: string) => boolean);
// Options received from the CLI arguments/options.
export type EnvOptions = {
  platform: string;
  root: string;
  dev: boolean;
  bundleType?: BundleFormat;
  bundleMode: BundlingMode;
  bundleTarget?: BundleOutputType;
  assetsDest?: string;
  bundleOutput?: string;
  sourcemapOutput?: string;
  minify?: boolean;
  port?: number;
  maxWorkers?: number;
};
export type WebpackConfigTransform = (params: {
  bundleName: string;
  config: webpack.Configuration;
  env: EnvOptions;
  runtime: Runtime;
}) => webpack.Configuration | void;
