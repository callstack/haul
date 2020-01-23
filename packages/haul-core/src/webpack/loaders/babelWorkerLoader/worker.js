// Forked Babel version
const version = '8.0.6';
const cache = require('./cache');
const transform = require('./transform');
const injectCaller = require('./injectCaller');
const fs = require('fs');

let babel;
try {
  babel = require('@babel/core');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    err.message +=
      "\n babel-loader@8 requires Babel 7.x (the package '@babel/core'). " +
      "If you'd like to use Babel 6.x ('babel-core'), you should install 'babel-loader@7'.";
  }
  throw err;
}

// Since we've got the reverse bridge package at @babel/core@6.x, give
// people useful feedback if they try to use it alongside babel-loader.
if (/^6\./.test(babel.version)) {
  throw new Error(
    "\n babel-loader@8 will not work with the '@babel/core@6' bridge package. " +
      "If you want to use Babel 6.x, install 'babel-loader@7'."
  );
}

function subscribe(subscriber, metadata, context) {
  if (context[subscriber]) {
    context[subscriber](metadata);
  }
}

async function loader(
  sourceFilename,
  inputSourceMap,
  overrides,
  filename,
  loaderOptions,
  sourceMap
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

  if (!babel.loadPartialConfig) {
    throw new Error(
      `babel-loader ^8.0.0-beta.3 requires @babel/core@7.0.0-beta.41, but ` +
        `you appear to be using "${babel.version}". Either update your ` +
        `@babel/core version, or pin you babel-loader version to 8.0.0-beta.2`
    );
  }

  const config = babel.loadPartialConfig(injectCaller(programmaticOptions));
  if (config) {
    let options = config.options;
    if (overrides && overrides.config) {
      options = await overrides.config.call(this, config, {
        source,
        map: inputSourceMap,
      });
    }

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
        '@babel/core': transform.version,
        '@babel/loader': version,
      }),
      cacheCompression = true,
      metadataSubscribers = [],
    } = loaderOptions;

    let result;
    if (cacheDirectory) {
      result = await cache({
        source,
        options,
        transform,
        cacheDirectory,
        cacheIdentifier,
        cacheCompression,
      });
    } else {
      result = await transform(source, options);
    }

    if (result) {
      if (overrides && overrides.result) {
        result = await overrides.result.call(this, result, {
          source,
          map: inputSourceMap,
          config,
          options,
        });
      }

      const { code, map, metadata } = result;

      metadataSubscribers.forEach(subscriber => {
        subscribe(subscriber, metadata, this);
      });

      return [code, map];
    }
  }

  // If the file was ignored, pass through the original content.
  return [source, inputSourceMap];
}

export const useLoader = async (
  source,
  inputSourceMap,
  overrides,
  fileName,
  customOptions,
  sourceMap
) =>
  loader(source, inputSourceMap, overrides, fileName, customOptions, sourceMap);
