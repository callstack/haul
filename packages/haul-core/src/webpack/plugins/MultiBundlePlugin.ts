import webpack from 'webpack';
import path from 'path';
import { BundleType } from '../../types';
import { BundleOutputPlugin } from './BundleOutputPlugin';

type BundleDependency = {
  bundleName: string;
  manifestPath?: string;
};

type MultiBundlePluginConfig = {
  bundleName: string;
  bundleType: BundleType;
  bundleOutputPath?: string;
  dependsOn: BundleDependency[];
};

export class MultiBundlePlugin {
  constructor(private config: MultiBundlePluginConfig) {}

  apply(compiler: webpack.Compiler) {
    const context = compiler.options.context || '';
    const outputPath = compiler.options.output?.path || '';
    const bundleOutputDirectory = BundleOutputPlugin.getBundleOutputDirectory(
      context,
      outputPath,
      this.config.bundleOutputPath
    );
    const library = this.config.bundleName;
    const libraryTarget = 'this';
    const plugins: webpack.Plugin[] = [];

    if (this.config.bundleType === 'dll') {
      plugins.push(
        new webpack.DllPlugin({
          name: library,
          path: path.join(bundleOutputDirectory, `${library}.manifest.json`),
        })
      );
    }

    this.config.dependsOn.forEach(bundleDependency => {
      plugins.push(
        new webpack.DllReferencePlugin({
          context,
          manifest:
            bundleDependency.manifestPath ||
            path.join(
              bundleOutputDirectory,
              `${bundleDependency.bundleName}.manifest.json`
            ),
          sourceType: libraryTarget,
        })
      );
    });

    if (this.config.bundleType === 'app') {
      compiler.options.output = {
        ...compiler.options.output,
        library,
        libraryTarget,
      };
    }

    plugins.forEach(plugin => plugin.apply(compiler));
  }
}
