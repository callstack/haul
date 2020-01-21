let babel;
try {
  babel = require("@babel/core");
} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    err.message +=
      "\n babel-loader@8 requires Babel 7.x (the package '@babel/core'). " +
      "If you'd like to use Babel 6.x ('babel-core'), you should install 'babel-loader@7'.";
  }
  // throw new Error('this is here')
 throw err;
}

// Since we've got the reverse bridge package at @babel/core@6.x, give
// people useful feedback if they try to use it alongside babel-loader.
if (/^6\./.test(babel.version)) {
  throw new Error(
    "\n babel-loader@8 will not work with the '@babel/core@6' bridge package. " +
    "If you want to use Babel 6.x, install 'babel-loader@7'.",
  );
}

const loaderUtils = require("loader-utils");
const Worker = require('jest-worker').default;

function makeLoader() {
  // throw new Error('success, but actually no');
  debugger
  const overrides = undefined;
  const worker = new Worker(require.resolve("./worker"), {
    numWorkers: 7,
    enableWorkerThreads: true,
  });
  return async function (source, inputSourceMap) {
    // Make the loader async
    const callback = this.async();
    const sourceMap = this.sourceMap
    const result = await worker
      .useLoader(
        source,
        inputSourceMap,
        overrides,
        this.resourcePath,
        loaderUtils.getOptions(this) || {},
        sourceMap
      )
      .then(args => callback(null, ...args), err => callback(err));
    return result
  };
}

module.exports = makeLoader();
module.exports.custom = makeLoader;
module.exports.pitch = makeLoader();
