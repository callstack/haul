import webpack from 'webpack';

/**
 * Preload required bundles for multi-bundle v1 in bundle bootstrapping logic.
 */
export class PreloadBundlesPlugin {
  private bundles: string[];

  /**
   * Constructs new `PreloadBundlesPlugin`.
   *
   * @param config - Config object with `bundles` array. Each value should represent a bundle name.
   */
  constructor({ bundles }: { bundles?: string[] }) {
    this.bundles = bundles || [];
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap('HaulPreloadBundlesPlugin', compilation => {
      (compilation.mainTemplate as any).hooks.bootstrap.tap(
        'HaulPreloadBundlesPlugin',
        (source: string) => {
          const preload = this.bundles.length
            ? `${this.bundles.map(
                bundleName =>
                  `if (!this["${bundleName}"]) { this.bundleRegistryLoad("${bundleName}", true, true); }\n`
              )}\n`
            : '';
          return `${preload}\n${source}`;
        }
      );
    });
  }
}
