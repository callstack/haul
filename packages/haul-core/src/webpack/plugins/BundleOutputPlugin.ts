import webpack from 'webpack';
import path from 'path';
import { BundleOutputType, Mode, BundleType, BundlingMode } from '../../types';
import { NormalizedTemplatesConfig } from '../../config/types';
import compileTemplate from '../../utils/compileTemplate';

type BundleOutputPluginConfig = {
  mode: Mode;
  platform: string;
  bundlingMode: BundlingMode;
  bundleName: string;
  bundleType: BundleType;
  bundleOutputType?: BundleOutputType;
  bundleOutputPath?: string;
  templatesConfig?: NormalizedTemplatesConfig;
};

export class BundleOutputPlugin {
  static getBundleOutputDirectory(
    context: string,
    outputPath: string,
    bundleOutputPath?: string
  ) {
    let bundleOutputDirectory = outputPath;
    if (bundleOutputPath) {
      // `bundleOutputPath` should be a directory, but for backward-compatibility,
      // we also handle the case with a filename.
      bundleOutputDirectory =
        path.extname(bundleOutputPath) === ''
          ? bundleOutputPath
          : path.dirname(bundleOutputPath);

      // Make sure it's absolute
      bundleOutputDirectory = path.isAbsolute(bundleOutputDirectory)
        ? bundleOutputDirectory
        : path.join(context, bundleOutputDirectory);
    }
    return bundleOutputDirectory;
  }

  constructor(private config: BundleOutputPluginConfig) {}

  compileFilenameTemplate() {
    const templateName =
      this.config.bundleOutputType === 'server'
        ? '__server__'
        : this.config.platform;
    const template = this.config.templatesConfig?.filename?.[templateName];
    if (template === undefined) {
      throw new Error(
        `Cannot find template for ${templateName} in ${JSON.stringify(
          this.config.templatesConfig || 'undefined'
        )}`
      );
    }

    return compileTemplate(template, {
      bundleName: this.config.bundleName,
      platform: this.config.platform,
      type: this.config.bundleType,
      mode: this.config.mode.startsWith('dev') ? 'dev' : 'prod',
    });
  }

  getOutputFilenameForSingleBundle(context: string, outputPath: string) {
    let filename: string;

    if (this.config.bundleOutputPath) {
      filename = path.isAbsolute(this.config.bundleOutputPath)
        ? path.relative(outputPath, this.config.bundleOutputPath)
        : path.relative(
            outputPath,
            path.join(context, this.config.bundleOutputPath)
          );
    } else {
      filename = this.compileFilenameTemplate();
    }

    return filename;
  }

  getOutputFilenameForMultiBundle(context: string, outputPath: string) {
    let filename = this.compileFilenameTemplate();
    if (this.config.bundleOutputPath) {
      const bundleOutputDirectory = BundleOutputPlugin.getBundleOutputDirectory(
        context,
        outputPath,
        this.config.bundleOutputPath
      );

      filename = path.relative(
        outputPath,
        path.join(bundleOutputDirectory, filename)
      );
    }

    return filename;
  }

  apply(compiler: webpack.Compiler) {
    const context = compiler.options.context || '';
    const outputPath = compiler.options.output?.path || '';

    const filename =
      this.config.bundlingMode === 'single-bundle'
        ? this.getOutputFilenameForSingleBundle(context, outputPath)
        : this.getOutputFilenameForMultiBundle(context, outputPath);

    compiler.options.output = {
      ...compiler.options.output,
      filename,
    };
  }
}
