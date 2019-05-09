import webpack from 'webpack';
import { MinifyOptions } from 'terser';
import Runtime from '../runtime/Runtime';

export type EnvOptions = {
  platform: string;
  root: string;
  dev: boolean;
  assetsDest?: string;
  minify?: boolean;
  bundle?: boolean;
  port?: number;
  providesModuleNodeModules?: Array<
    string | { name: string; directory: string }
  >;
  hasteOptions?: any;
  initializeCoreLocation?: string;
  hotReloading?: boolean;
};

export type HaulConfigBuilder = ((opts: EnvOptions) => HaulConfig) | HaulConfig;

export type HaulConfig = {
  entry: string | string[];
  inlineSourceMap?: boolean;
};

export type WebpackConfigBuilder = (
  runtime: Runtime,
  options: EnvOptions
) => webpack.Configuration;

export type RamBundleDebugOptions = {
  path: string;
  renderBootstrap?: boolean;
  renderModules?: boolean;
};

export type RamBundleConfig = {
  debug?: RamBundleDebugOptions;
  minification?: { enabled: boolean } & Pick<
    MinifyOptions,
    Exclude<keyof MinifyOptions, 'sourceMap'>
  >;
};

export type ProjectConfig = {
  webpack: webpack.Configuration | WebpackConfigBuilder;
  ramBundle?: RamBundleConfig;
};

export type PresetBuilder = (haulConfig: HaulConfig) => WebpackConfigBuilder;
