import webpack from 'webpack';
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

export type HaulConfig = {
  entry: string | string[];
};

export type WebpackConfigBuilder = (
  runtime: Runtime,
  options: EnvOptions
) => webpack.Configuration;

export type ProjectConfig = {
  webpack: webpack.Configuration | WebpackConfigBuilder;
};

export type PresetBuilder = (haulConfig: HaulConfig) => WebpackConfigBuilder;
