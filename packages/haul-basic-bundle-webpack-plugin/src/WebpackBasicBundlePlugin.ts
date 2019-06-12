import webpack from 'webpack';
import { RawSource } from 'webpack-sources';
import Concat from 'concat-with-sourcemaps';

const asyncEval = `
// Fetch and eval async chunks
function asyncEval(url) {
  return fetch(url)
    .then(res => res.text())
    .then(src => eval(src + "\\n//# sourceURL=" + url));
}
`;

/**
 * Adds React Native specific tweaks to bootstrap logic.
 */
export default class WebpackBasicBundlePlugin {
  private bundle: boolean;
  private sourceMap: boolean;
  private preloadBundles: string[];

  constructor({
    bundle,
    sourceMap,
    preloadBundles,
  }: {
    bundle: boolean;
    sourceMap?: boolean;
    preloadBundles?: string[];
  }) {
    this.bundle = bundle;
    this.sourceMap = Boolean(sourceMap);
    this.preloadBundles = preloadBundles || [];
  }

  apply(compiler: webpack.Compiler) {
    if (this.bundle) {
      // When creating basic bundle (non-RAM), async chunks will be concatenated into main bundle.
      // This will allow easy switching between RAM bundle and non-RAM static bundle.
      compiler.hooks.emit.tap('WebpackBasicBundlePlugin', compilation => {
        // Skip if there is no async chunks.
        if (compilation.chunks.length === 1) {
          return;
        }

        const {
          mainMap,
          mainSource: mainSourceFilename,
          asyncChunks,
        } = this.getFilenamesFromChunks(compilation.chunks);

        const sourceMappingRegex = /\/\/# sourceMappingURL=(.+)/;
        const mainSource = compilation.assets[mainSourceFilename].source();
        const sourceMappingMatch = new RegExp(sourceMappingRegex, 'g').exec(
          mainSource
        );

        // Concatenate all chunks and its source maps. Chunks source needs to have source mapping URL
        // removed, since it will be added at the end of the whole bundle.
        const concat = new Concat(true, mainSourceFilename, '\n');
        concat.add(
          mainSourceFilename,
          mainSource.replace(new RegExp(sourceMappingRegex, 'g'), ''),
          this.sourceMap ? compilation.assets[mainMap].source() : undefined
        );
        asyncChunks.forEach(chunk => {
          concat.add(
            chunk.source,
            (compilation.assets[chunk.source].source() as string).replace(
              new RegExp(sourceMappingRegex, 'g'),
              ''
            ),
            this.sourceMap ? compilation.assets[chunk.map].source() : undefined
          );
        });

        // Add single source mapping url pointing to file with concatenated source maps.
        if (sourceMappingMatch) {
          concat.add(null, sourceMappingMatch[0]);
        }

        // Remove async chunks
        const filesToRemove: string[] = compilation.chunks.reduce(
          (acc, chunk) => {
            if (chunk.name !== 'main') {
              return [...acc, ...chunk.files];
            }
            return acc;
          },
          []
        );
        Object.keys(compilation.assets).forEach(assetName => {
          const remove = filesToRemove.some(file => assetName.endsWith(file));
          if (remove) {
            delete compilation.assets[assetName];
          }
        });

        // Assign concatenated bundle to main asset
        compilation.assets[mainSourceFilename] = new RawSource(
          concat.content.toString('utf8')
        );
        if (this.sourceMap) {
          // Assign concatenated source maps to main source map.
          compilation.assets[mainMap] = new RawSource(concat.sourceMap || '');
        }
      });
    }

    compiler.hooks.compilation.tap('WebpackBasicBundlePlugin', compilation => {
      if (!this.bundle) {
        // Add asyncEval only when serving from packager server. When bundling async
        // chunks will be concatenated into the bundle.
        (compilation.mainTemplate as any).hooks.bootstrap.tap(
          'WebpackBasicBundlePlugin',
          (source: string) => {
            const preload = this.preloadBundles.length
              ? `${this.preloadBundles.map(
                  bundleName =>
                    `this.bundleRegistryLoad("${bundleName}", true, true)\n`
                )}\n`
              : '';
            return `${preload}${asyncEval}\n${source}`;
          }
        );
      }

      (compilation.mainTemplate as any).hooks.requireEnsure.tap(
        'WebpackBasicBundlePlugin',
        (source: string) => {
          // throw new Error(typeof source);
          // The is no `importScripts` in react-native. Replace it with Promise based
          // fetch + eval and return the promise so the webpack module system and bootstrapping
          // logic is not broken.
          // When creating static bundle, async chunks will be concatenated into the bundle,
          // so by the time they are required, they should already be loaded into the module system.
          return source.replace(
            /importScripts\((.+)\)/gm,
            this.bundle
              ? 'throw new Error("Invalid bundle: async chunk not loaded. ' +
                  'Please open an issue at https://github.com/callstack/haul")'
              : 'return asyncEval(__webpack_require__.p + $1)'
          );
        }
      );
    });
  }

  private getFilenamesFromChunks(
    chunks: Array<{ name: string; files: string[] }>
  ) {
    const mainChunk = chunks.find(chunk => chunk.name === 'main');
    const otherChunks = chunks.filter(chunk => chunk.name !== 'main');

    const mapRegex = /\.map$/;

    return {
      mainSource: mainChunk!.files.find(item => !mapRegex.test(item)) || '',
      mainMap: mainChunk!.files.find(item => mapRegex.test(item)) || '',
      asyncChunks: otherChunks.map(chunk => ({
        source: chunk!.files.find(item => !mapRegex.test(item)) || '',
        map: chunk!.files.find(item => mapRegex.test(item)) || '',
      })),
    };
  }
}
