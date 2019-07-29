import Module from 'module';
import { withPolyfillsFactory, makeConfigFactory } from '@haul-bundler/core';
import getDefaultConfig from './defaultConfig';
import { resolve } from 'path';

function resolvePolyfill(name: string) {
  const filename = `react-native/Libraries/polyfills/${name}.js`;
  try {
    return require.resolve(filename);
  } catch (e) {
    // NOOP: try next resolution logic
  }

  try {
    // Try to resolve polyfill path as though it was required from 'haul.config.js' in CWD.
    return ((Module.createRequireFromPath(
      resolve('haul.config.js')
    ) as unknown) as {
      resolve: (filename: string) => string;
    }).resolve(filename);
  } catch (e) {
    // NOOP: try next resolution logic
  }

  throw new Error(
    `Cannot resolve neither '${filename}' nor '${resolve(
      filename
    )}'. Please make sure you have 'react-native' installed.`
  );
}

const polyfills = [
  resolvePolyfill('console'),
  resolvePolyfill('error-guard'),
  resolvePolyfill('Object.es7'),
];

export const withPolyfills = withPolyfillsFactory(polyfills);
export const makeConfig = makeConfigFactory(getDefaultConfig);
