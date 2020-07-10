import webpack from 'webpack';
import path from 'path';
import { BundleOutputType, Mode, BundleType, BundlingMode } from '../../types';
import { TemplatesConfig } from '../../configuration/Configuration';
import compileTemplate from '../../utils/compileTemplate';

type BundleOutputPluginConfig = {
  mode: Mode;
  platform: string;
  bundlingMode: BundlingMode;
  bundleName: string;
  bundleType: BundleType;
  bundleOutputType?: BundleOutputType;
  bundleOutputPath?: string;
  templatesConfig?: TemplatesConfig;
};

/**
 * A Webpack plugin that configures path and filename of a compiled bundle.
 */
export class BundleOutputPlugin {
  /**
   * Compute output directory for bundle.
   *
   * @param context Absolute path to project directory, usually a command working directory.
   * @param outputPath Absolute path to output directory for all bundle related files (eg assets).
   * @param bundleOutputPath Path to or filename of output bundle exclusive destination.
   */
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

  /**
   * Constructs a new `BundleOutputPlugin`.
   *
   * @param config Plugin configuration:
   * - `mode` - mode in which the bundle will be compiled,
   * - `platform` - platform for which the bundle will be compiled,
   * - `bundlingMode` - bundling mode,
   * - `bundleName` - name of the bundle,
   * - `bundleType` - type of the bundle,
   * - `bundleOutputType?` - type of the bundle output,
   * - `bundleOutputPath?` - custom path to or filename of the bundle destination,
   * - `templatesConfig?` - templates config.
   */
  constructor(private config: BundleOutputPluginConfig) {}

  /**
   * Compute filename for a bundle (eg. `hello.platform.bundle`) from provided
   * in constructor temples.
   */
  compileFilenameTemplate() {
    const templateName =
      this.config.bundleOutputType === 'server'
        ? '__server__'
        : this.config.platform;
    let template = this.config.templatesConfig?.filename?.[templateName];
    if (template === undefined) {
      template = this.config.templatesConfig?.filename?.['__fallback__'];
    }

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

  /**
   * Compute final bundle filename when running in single-bundle bundling mode.
   * If `bundleOutputPath` was provided in constructor, it will be used for computing
   * the output filename, otherwise the filename will be compiled for templates.
   *
   * @param context Absolute path to project directory, usually a command working directory.
   * @param outputPath Absolute path to output directory for all bundle related files (eg assets).
   */
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

  /**
   * Compute final bundle filename when running in multi-bundle bundling mode.
   * The output filename is compiled from templates, but can be altered if the `bundleOutputPath`
   * was provided in the constructor.
   *
   * @param context Absolute path to project directory, usually a command working directory.
   * @param outputPath Absolute path to output directory for all bundle related files (eg assets).
   */
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
