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
export default class ReactNativeEnvPlugin {
  constructor(private bundle: boolean) {}

  apply(compiler: webpack.Compiler) {
    if (this.bundle) {
      compiler.hooks.emit.tap('ReactNativeEnvPlugin', compilation => {
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

        // Concatenate all chunks and it's source maps. Chunks source needs to have source mapping URL
        // removed, since it will be added at the end of the whole bundle.
        const concat = new Concat(true, mainSourceFilename, '\n');
        concat.add(
          mainSourceFilename,
          mainSource.replace(new RegExp(sourceMappingRegex, 'g'), ''),
          compilation.assets[mainMap].source()
        );
        asyncChunks.forEach(chunk => {
          concat.add(
            chunk.source,
            (compilation.assets[chunk.source].source() as string).replace(
              new RegExp(sourceMappingRegex, 'g'),
              ''
            ),
            compilation.assets[chunk.map].source()
          );
        });

        // Add single source mapping url pointing to file with concatenated source maps.
        if (sourceMappingMatch) {
          concat.add(null, sourceMappingMatch[0]);
        }

        // Remove non-main assets
        Object.keys(compilation.assets)
          .filter(item => ![mainSourceFilename, mainMap].includes(item))
          .forEach(item => {
            delete compilation.assets[item];
          });

        // Assign concatenated bundle to main asset
        compilation.assets[mainSourceFilename] = new RawSource(
          concat.content.toString('utf8')
        );
        // Assign concatenated source maps to main source map.
        compilation.assets[mainMap] = new RawSource(concat.sourceMap || '');
      });
    }

    compiler.hooks.thisCompilation.tap('ReactNativeEnvPlugin', compilation => {
      if (!this.bundle) {
        // Add asyncEval only when serving from packager server. When bundling async
        // chunks will be concatenated into the bundle.
        (compilation.mainTemplate as any).hooks.bootstrap.tap(
          'ReactNativeEnvPlugin',
          (source: string) => {
            return `${asyncEval}\n${source}`;
          }
        );
      }

      (compilation.mainTemplate as any).hooks.requireEnsure.tap(
        'ReactNativeEnvPlugin',
        (source: string) => {
          // The is no `importScripts` in react-native. Replace it with Promise based
          // fetch + eval and return the promise so the webpack module system and bootstrapping
          // logic is not broken.
          // When creating static bundle, async chunks will be concatenated into the bundle,
          // so by the time they are required, they should already by loaded into the module system.
          return source.replace(
            /importScripts\((.+)\)/gm,
            this.bundle
              ? 'throw new Error("async chunks were not concatenated into the bundle")'
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
