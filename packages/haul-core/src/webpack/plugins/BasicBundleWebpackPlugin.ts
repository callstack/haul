import webpack from 'webpack';

/**
 * Adds React Native specific tweaks to bootstrap logic.
 */
export default class BasicBundleWebpackPlugin {
  private preloadBundles: string[];

  constructor({ preloadBundles }: { preloadBundles?: string[] }) {
    this.preloadBundles = preloadBundles || [];
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap('BasicBundleWebpackPlugin', compilation => {
      (compilation.mainTemplate as any).hooks.bootstrap.tap(
        'BasicBundleWebpackPlugin',
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
