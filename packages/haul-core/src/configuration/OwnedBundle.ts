import { MinifyOptions } from 'terser';
import {
  BundleFormat,
  BundleType,
  LooseModeConfig,
  SourceMap,
  Mode,
  WebpackConfigTransform,
  EnvOptions,
} from '../types';

import webpack from 'webpack';

export type OwnedBundleProperties = {
  mode: Mode;
  platform: string;
  format: BundleFormat;
  type: BundleType;
  context: string;
  inputModuleNames: string[];
  preloadModuleNames: string[];
  assetsDestination?: string;
  minify: boolean;
  minifyOptions?: Pick<
    MinifyOptions,
    Exclude<keyof MinifyOptions, 'sourceMap'>
  >;
  sourceMap: SourceMap;
  looseMode: LooseModeConfig;
  dependsOn: string[];
  providesModuleNodeModules?: Array<
    string | { name: string; directory: string }
  >;
  hasteOptions?: any;
  maxWorkers: number;
};

export class OwnedBundle {
  constructor(
    public name: string,
    public properties: OwnedBundleProperties,
    private envOptions: EnvOptions,
    private transform?: WebpackConfigTransform
  ) {}

  makeWebpackConfig(): webpack.Configuration {}
}
