let babelCore;
try {
  babelCore = require('@babel/core');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    err.message +=
      "\n babel-loader@8 requires Babel 7.x (the package '@babel/core'). " +
      "If you'd like to use Babel 6.x ('babel-core'), you should install 'babel-loader@7'.";
  }
  // throw new Error('this is here')
  throw err;
}

// Since we've got the reverse bridge package at @babel/core@6.x, give
// people useful feedback if they try to use it alongside babel-loader.
if (/^6\./.test(babelCore.version)) {
  throw new Error(
    "\n babel-loader@8 will not work with the '@babel/core@6' bridge package. " +
      "If you want to use Babel 6.x, install 'babel-loader@7'."
  );
}

const loaderUtils = require('loader-utils');
const Worker = require('jest-worker').default;

type This = {
  async: () => (error: Error | null, args?: Object) => void;
  sourceMap: string;
  resourcePath: string;
};

function makeLoader() {
  const overrides = undefined;
  let worker: undefined | typeof Worker = undefined;

  return async function(this: This, source: string, inputSourceMap: string) {
    const options = loaderUtils.getOptions(this) || {};
    if (worker === undefined) {
      worker = new Worker(require.resolve('./worker'), {
        numWorkers: options.maxWorkers,
        enableWorkerThreads: true,
      });
    }
    // when passed to the loader ReferenceError: Unknown option: .maxWorkers
    delete options.maxWorkers;

    // Make the loader async
    const callback = this.async();
    const sourceMap = this.sourceMap;
    const result = await worker
      .useLoader(
        source,
        inputSourceMap,
        overrides,
        this.resourcePath,
        options,
        sourceMap
      )
      .then(
        (args: []) => callback(null, ...args),
        (err: Error) => callback(err)
      );
    return result;
  };
}
module.exports = makeLoader();
module.exports.custom = makeLoader;
module.exports.pitch = makeLoader();
