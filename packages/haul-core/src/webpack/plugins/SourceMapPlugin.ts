import webpack from 'webpack';
import path from 'path';
import { BundleFormat, SourceMap } from '../../types';

type SourceMapPluginConfig = {
  bundleFormat: BundleFormat;
  sourceMap: SourceMap;
  sourceMapOutput?: string;
  serverHost?: string;
  serverPort?: number | string;
  devToolOptions?: any;
};

export class SourceMapPlugin {
  constructor(private config: SourceMapPluginConfig) {
    this.config.devToolOptions = {
      test: /\.(js|jsx|css|ts|tsx|(js)?bundle)($|\?)/i,
      module: true,
      ...this.config.devToolOptions,
    };
  }

  apply(compiler: webpack.Compiler) {
    // Source map generation for RAM bundles is handled `RamBundlePlugin`.
    if (this.config.bundleFormat !== 'basic-bundle') {
      return;
    }

    let filename = '[file].map';
    if (this.config.sourceMapOutput) {
      filename = path.isAbsolute(this.config.sourceMapOutput)
        ? path.relative(
            compiler.options.output!.path!,
            this.config.sourceMapOutput
          )
        : path.relative(
            compiler.options.output!.path!,
            path.join(compiler.options.context!, this.config.sourceMapOutput)
          );
    }

    let plugin:
      | webpack.EvalSourceMapDevToolPlugin
      | webpack.SourceMapDevToolPlugin;

    if (this.config.sourceMap === 'inline') {
      plugin = new webpack.EvalSourceMapDevToolPlugin({
        ...this.config.devToolOptions,
        publicPath: `http://${this.config.serverHost}:${this.config.serverPort}/`,
      });
    } else {
      plugin = new webpack.SourceMapDevToolPlugin({
        ...this.config.devToolOptions,
        filename,
        moduleFilenameTemplate: '[absolute-resource-path]',
      });
    }

    plugin.apply(compiler);
  }
}
