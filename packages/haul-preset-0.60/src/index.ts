import { withPolyfillsFactory, makeConfigFactory } from '@haul-bundler/core';
import getDefaultConfig from './defaultConfig';

function resolvePolyfill(name: string) {
  const filename = `react-native/Libraries/polyfills/${name}.js`;
  const searchPaths = [...module.paths, process.cwd()];
  try {
    return require.resolve(filename, { paths: searchPaths });
  } catch (e) {
    throw new Error(
      `Cannot resolve '${filename}' in [${searchPaths.join(
        ', '
      )}]'. Please make sure you have 'react-native' installed.`
    );
  }
}

const polyfills = [
  resolvePolyfill('console'),
  resolvePolyfill('error-guard'),
  resolvePolyfill('Object.es7'),
];

export const withPolyfills = withPolyfillsFactory(polyfills);
export const makeConfig = makeConfigFactory(getDefaultConfig);
