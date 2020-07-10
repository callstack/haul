import { MinifyOptions } from 'terser';
import path from 'path';
import webpack from 'webpack';
import {
  BundleFormat,
  BundleType,
  LooseModeConfig,
  SourceMap,
  Mode,
  BundlingMode,
  BundleOutputType,
} from '../types';
import { LooseModePlugin } from '../webpack/plugins/LooseModePlugin';
import { Configuration } from './Configuration';
import { PreloadModulesDllPlugin } from '../webpack/plugins/PreloadModulesDllPlugin';
import { SourceMapPlugin } from '../webpack/plugins/SourceMapPlugin';
import { BundleOutputPlugin } from '../webpack/plugins/BundleOutputPlugin';
import { PreloadBundlesPlugin } from '../webpack/plugins/PreloadBundlesPlugin';
import { RamBundlePlugin } from '../webpack/plugins/RamBundlePlugin';
import { MultiBundlePlugin } from '../webpack/plugins/MultiBundlePlugin';

export type OwnedBundleProperties = {
  mode: Mode;
  platform: string;
  format: BundleFormat;
  type: BundleType;
  bundlingMode: BundlingMode;
  outputType: BundleOutputType;
  outputPath?: string;
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
  sourceMapDestination?: string;
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
    private baseWebpackConfig: webpack.Configuration,
    private transform?: (
      config: webpack.Configuration
    ) => webpack.Configuration | void
  ) {
    console.log(this.properties);
  }

  makeWebpackConfig(configuration: Configuration): webpack.Configuration {
    const bundleIdsMap: {
      [bundleName: string]: number;
    } = configuration.bundleNames.reduce((acc, bundleName, index) => {
      return {
        ...acc,
        [bundleName]: index,
      };
    }, {});
    let webpackConfig = this.baseWebpackConfig;

    if (this.properties.assetsDestination) {
      webpackConfig.output!.path = path.isAbsolute(
        this.properties.assetsDestination
      )
        ? this.properties.assetsDestination
        : path.join(this.properties.context, this.properties.assetsDestination);
    }

    webpackConfig.plugins = webpackConfig.plugins || [];

    webpackConfig.plugins.push(
      new SourceMapPlugin({
        bundleFormat: this.properties.format,
        sourceMap: this.properties.sourceMap,
        sourceMapOutput: this.properties.sourceMapDestination,
      })
    );

    webpackConfig.plugins.push(
      new BundleOutputPlugin({
        mode: this.properties.mode,
        platform: this.properties.platform,
        bundleName: this.name,
        bundleType: this.properties.type,
        bundlingMode: this.properties.bundlingMode,
        bundleOutputType: this.properties.outputType,
        bundleOutputPath: this.properties.outputPath,
        templatesConfig: configuration.templates,
      })
    );

    webpackConfig.plugins.push(
      new webpack.DefinePlugin({
        'process.env.HAUL_BUNDLES': JSON.stringify(bundleIdsMap),
      })
    );

    webpackConfig.plugins.push(new LooseModePlugin(this.properties.looseMode));

    if (this.properties.format === 'basic-bundle') {
      if (this.properties.bundlingMode === 'multi-bundle') {
        webpackConfig.plugins.push(
          new PreloadBundlesPlugin({
            bundles:
              configuration.features.multiBundle < 2
                ? this.properties.dependsOn
                : [],
          })
        );
      }
    } else {
      webpackConfig.plugins.push(
        new RamBundlePlugin({
          type: this.properties.format,
          bundlingMode: this.properties.bundlingMode,
          minify: this.properties.minify,
          minifyOptions: this.properties.minifyOptions,
          sourceMap: Boolean(this.properties.sourceMap),
          preloadBundles:
            configuration.features.multiBundle < 2
              ? this.properties.dependsOn
              : [],
          maxWorkers: this.properties.maxWorkers,
          bundleId:
            configuration.features.multiBundle < 2
              ? this.name
              : bundleIdsMap[this.name],
          bundleName: this.name,
        })
      );
    }

    if (this.properties.bundlingMode === 'multi-bundle') {
      webpackConfig.plugins.push(
        new MultiBundlePlugin({
          bundleName: this.name,
          bundleType: this.properties.type,
          dependsOn: this.properties.dependsOn.map(bundleDependencyName => ({
            bundleName: bundleDependencyName,
            manifestPath:
              configuration.externalBundles.find(
                externalBundle => externalBundle.name === bundleDependencyName
              )?.properties.manifestPath || undefined,
          })),
        })
      );

      if (
        this.properties.type === 'dll' &&
        configuration.features.multiBundle >= 2
      ) {
        webpackConfig.plugins.push(
          new PreloadModulesDllPlugin({
            modules: this.properties.preloadModuleNames,
          })
        );
      }
    }

    if (this.transform) {
      webpackConfig = this.transform(webpackConfig) || webpackConfig;
    }

    return webpackConfig;
  }
}
