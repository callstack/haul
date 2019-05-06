import webpack from 'webpack';

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
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap('ReactNativeEnvPlugin', compilation => {
      (compilation.mainTemplate as any).hooks.bootstrap.tap(
        'ReactNativeEnvPlugin',
        (source: string) => {
          return `${asyncEval}\n${source}`;
        }
      );
      (compilation.mainTemplate as any).hooks.requireEnsure.tap(
        'ReactNativeEnvPlugin',
        (source: string) => {
          // The is no `importScripts` in react-native. Replace it with Promise based
          // fetch + eval and return the promise so the webpack module system and bootstrapping
          // logic is not broken.
          return source.replace(
            /importScripts\((.+)\)/gm,
            'return asyncEval(__webpack_require__.p + $1)'
          );
        }
      );
    });
  }
}
