import fs from 'fs';
import * as babel from '@babel/core';

import cache from './vendor/cache';
import transform from './vendor/transform';

const injectCaller = (opts: { [prop: string]: unknown; caller?: any }) => ({
  ...opts,
  caller: {
    name: 'babel-loader',
    supportsStaticESM: true,
    supportsDynamicImport: true,
    ...opts.caller,
  },
});

const subscribe = (
  subscriber: string | number,
  metadata: any,
  context: { [x: string]: (arg0: any) => void }
) => context[subscriber] && context[subscriber](metadata);

export async function process(
  this: any,
  sourceFilename: string,
  inputSourceMap: string,
  filename: string,
  loaderOptions: {
    sourceMap?: any;
    sourceMaps?: any;
    cacheDirectory?: any;
    cacheIdentifier?: any;
    cacheCompression?: any;
    metadataSubscribers?: any;
    customize?: any;
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
  delete programmaticOptions.customize;
  delete programmaticOptions.cacheDirectory;
  delete programmaticOptions.cacheIdentifier;
  delete programmaticOptions.cacheCompression;
  delete programmaticOptions.metadataSubscribers;

  const config = babel!.loadPartialConfig(injectCaller(programmaticOptions));
  if (config) {
    let options = config.options;

    if (options.sourceMaps === 'inline') {
      // Babel glitch
      options.sourceMaps = true;
    }

    const {
      cacheDirectory = null,
      cacheIdentifier = JSON.stringify({
        options,
        '@babel/core': babel.version,
        // forked babel loader version
        '@babel/loader': '8.06',
      }),
      cacheCompression = true,
      metadataSubscribers = [],
    } = loaderOptions;

    let result;
    if (cacheDirectory) {
      result = await cache({
        source,
        options,
        cacheDirectory,
        cacheIdentifier,
        cacheCompression,
      });
    } else {
      result = await transform(source, options);
    }

    if (result) {
      const { code, map, metadata } = result;

      metadataSubscribers.forEach((subscriber: any) => {
        subscribe(subscriber, metadata, this);
      });

      return [code, map];
    }
  }

  // If the file was ignored, pass through the original content.
  return [source, inputSourceMap];
}
