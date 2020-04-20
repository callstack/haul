import webpack from 'webpack';

/**
 * Adds React Native specific tweaks to bootstrap logic.
 */
export default class WebpackBasicBundlePlugin {
  private preloadBundles: string[];

  constructor({ preloadBundles }: { preloadBundles?: string[] }) {
    this.preloadBundles = preloadBundles || [];
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap('WebpackBasicBundlePlugin', compilation => {
      (compilation.mainTemplate as any).hooks.bootstrap.tap(
        'WebpackBasicBundlePlugin',
        (source: string) => {
          const preload = this.preloadBundles.length
            ? `${this.preloadBundles.map(
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
