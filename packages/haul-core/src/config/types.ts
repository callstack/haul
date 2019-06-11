import webpack from 'webpack';
import { MinifyOptions } from 'terser';
import { DeepNonNullable, Overwrite } from 'utility-types';
import Runtime from '../runtime/Runtime';

export type ServerConfig = {
  port?: number;
  host?: string;
};

// Options received from the CLI arguments/options.
export type EnvOptions = {
  platform: string;
  root: string;
  dev: boolean;
  bundleType: 'basic-bundle' | 'indexed-ram-bundle' | 'file-ram-bundle';
  singleBundleMode: boolean;
  assetsDest?: string;
  bundleOutput?: string;
  sourcemapOutput?: string;
  minify?: boolean;
  bundle?: boolean;
  port?: number;
};

export type BundleConfig = {
  entry: string | string[];
  type?: 'basic-bundle' | 'indexed-ram-bundle' | 'file-ram-bundle';
  platform?: string;
  root?: string;
  dev?: boolean;
  assetsDest?: string;
  minify?: boolean;
  minifyOptions?: Pick<
    MinifyOptions,
    Exclude<keyof MinifyOptions, 'sourceMap'>
  >;
  sourceMap?: boolean | 'inline';
  dllDependencies?: string[];
  providesModuleNodeModules?: Array<
    string | { name: string; directory: string }
  >;
  hasteOptions?: any;
  transform?: WebpackConfigTransform;
};

export type NormalizedBundleConfig = Overwrite<
  Pick<DeepNonNullable<BundleConfig>, Exclude<keyof BundleConfig, 'transform'>>,
  { minifyOptions: BundleConfig['minifyOptions'] }
>;

export type WebpackConfigTransform = (params: {
  bundleName: string;
  config: webpack.Configuration;
  env: EnvOptions;
  runtime: Runtime;
}) => webpack.Configuration;

export type BundleConfigBuilder = (env: EnvOptions) => BundleConfig;

export type ProjectConfig = {
  server?: ServerConfig;
  bundles: { [bundleName: string]: BundleConfigBuilder | BundleConfig };
};

export type NormalizedProjectConfig = {
  server: DeepNonNullable<ServerConfig>;
  bundles: { [bundleName: string]: NormalizedBundleConfig };
  webpackConfigs: { [bundleName: string]: webpack.Configuration };
};

export type NormalizedProjectConfigBuilder = (
  runtime: Runtime,
  env: EnvOptions
) => NormalizedProjectConfig;
