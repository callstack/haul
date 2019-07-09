import { withPolyfillsFactory, makeConfigFactory } from '@haul-bundler/core';
import getDefaultConfig from './defaultConfig';

const polyfills = [
  require.resolve('react-native/Libraries/polyfills/console.js'),
  require.resolve('react-native/Libraries/polyfills/error-guard.js'),
  require.resolve('react-native/Libraries/polyfills/Object.es7.js'),
];

export const withPolyfills = withPolyfillsFactory(polyfills);
export const makeConfig = makeConfigFactory(getDefaultConfig);
