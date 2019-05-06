import webpack from 'webpack';

const asyncEval = `
// Fetch and eval async chunks
function asyncEval(url) {
  return fetch(url).then(res => res.text()).then(src => eval(src));
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

      (compilation.mainTemplate as any).requireEnsure.tap(
        'ReactNativeEnvPlugin',
        (source: string) => {
          return source.replace(
            /importScripts\((.+)\)/gm,
            'return asyncEval(__webpack_require__.p + $1)'
          );
        }
      );
    });
  }
}
