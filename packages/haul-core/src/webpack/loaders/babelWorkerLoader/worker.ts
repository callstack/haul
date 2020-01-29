import fs from 'fs';
import * as babel from '@babel/core';

import cache from './vendor/cache';
import transform from './vendor/transform';

const injectCaller = (opts: { [prop: string]: unknown; caller?: any }) => ({
  ...opts,
  caller: {
    name: 'babelWorkerLoader',
    supportsStaticESM: true,
    supportsDynamicImport: true,
    ...opts.caller,
  },
});

export async function process(
  this: any,
  sourceFilename: string,
  inputSourceMap: string,
  filename: string,
  loaderOptions: {
    sourceMap?: any;
    sourceMaps?: any;
    cacheDirectory?: string;
    cacheIdentifier?: string;
    cacheCompression?: boolean;
  },
  sourceMap: string
) {
  const source = fs.readFileSync(sourceFilename, 'utf8');

  if ('sourceMap' in loaderOptions && !('sourceMaps' in loaderOptions)) {
    loaderOptions = {
      ...loaderOptions,
      sourceMaps: loaderOptions.sourceMap,
    };
    delete loaderOptions.sourceMap;
  }

  const programmaticOptions = {
    ...loaderOptions,
    filename,
    inputSourceMap: inputSourceMap || undefined,
    sourceMaps:
      loaderOptions.sourceMaps === undefined
        ? sourceMap
        : loaderOptions.sourceMaps,
    sourceFileName: filename,
  };

  // Remove loader related options
  delete programmaticOptions.cacheDirectory;
  delete programmaticOptions.cacheIdentifier;
  delete programmaticOptions.cacheCompression;

  const config = babel!.loadPartialConfig(injectCaller(programmaticOptions));
  if (config) {
    let options = config.options;

    if (options.sourceMaps === 'inline') {
      // Babel glitch
      options.sourceMaps = true;
    }

    const { cacheDirectory = null, cacheCompression = true } = loaderOptions;

    const result = cacheDirectory
      ? await cache({
          source,
          options,
          cacheDirectory,
          cacheIdentifier:
            loaderOptions.cacheIdentifier ||
            JSON.stringify({
              options,
              // to do: get value from package.json
              '@haul-bundle/core': '0.16.0-alpha.1',
            }),
          cacheCompression,
        })
      : await transform(source, options);

    if (result) {
      return [result.code, result.map];
    }
  }
  return [source, inputSourceMap];
}
