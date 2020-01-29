import fs from 'fs';
import * as babel from '@babel/core';

import cache from './vendor/cache';
import transform from './vendor/transform';

function injectCaller(opts: { [prop: string]: unknown; caller?: any }) {
  return Object.assign({}, opts, {
    caller: Object.assign(
      {
        name: 'babel-loader',
        supportsStaticESM: true,
        supportsDynamicImport: true,
      },
      opts.caller
    ),
  });
}

function subscribe(
  subscriber: string | number,
  metadata: any,
  context: { [x: string]: (arg0: any) => void }
) {
  if (context[subscriber]) {
    context[subscriber](metadata);
  }
}

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

  // Standardize on 'sourceMaps' as the key passed through to Webpack, so that
  // users may safely use either one alongside our default use of
  // 'this.sourceMap' below without getting error about conflicting aliases.
  if (
    Object.prototype.hasOwnProperty.call(loaderOptions, 'sourceMap') &&
    !Object.prototype.hasOwnProperty.call(loaderOptions, 'sourceMaps')
  ) {
    loaderOptions = Object.assign({}, loaderOptions, {
      sourceMaps: loaderOptions.sourceMap,
    });
    delete loaderOptions.sourceMap;
  }

  const programmaticOptions = Object.assign({}, loaderOptions, {
    filename,
    inputSourceMap: inputSourceMap || undefined,

    // Set the default sourcemap behavior based on Webpack's mapping flag,
    // but allow users to override if they want.
    sourceMaps:
      loaderOptions.sourceMaps === undefined
        ? sourceMap
        : loaderOptions.sourceMaps,

    // Ensure that Webpack will get a full absolute path in the sourcemap
    // so that it can properly map the module back to its internal cached
    // modules.
    sourceFileName: filename,
  });
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
      // Babel has this weird behavior where if you set "inline", we
      // inline the sourcemap, and set 'result.map = null'. This results
      // in bad behavior from Babel since the maps get put into the code,
      // which Webpack does not expect, and because the map we return to
      // Webpack is null, which is also bad. To avoid that, we override the
      // behavior here so "inline" just behaves like 'true'.
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
