import webpack from 'webpack';
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

    let plugin:
      | webpack.EvalSourceMapDevToolPlugin
      | webpack.SourceMapDevToolPlugin;

    if (this.config.sourceMap === 'inline' || !this.config.sourceMapOutput) {
      plugin = new webpack.EvalSourceMapDevToolPlugin({
        ...this.config.devToolOptions,
        publicPath: `http://${this.config.serverHost}:${this.config.serverPort}/`,
      });
    } else {
      plugin = new webpack.SourceMapDevToolPlugin({
        ...this.config.devToolOptions,
        filename: this.config.sourceMapOutput,
        moduleFilenameTemplate: '[absolute-resource-path]',
      });
    }

    compiler.options.plugins = (compiler.options.plugins || []).concat(plugin);
  }
}
