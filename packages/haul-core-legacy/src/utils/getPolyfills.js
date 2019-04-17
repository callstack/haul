/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * JS polyfills for JSC
 * Temporary backport of https://github.com/facebook/react-native/blob/v0.55.3/rn-get-polyfills.js
 *
 * @flow
 */

module.exports = () => [
  require.resolve('../vendor/polyfills/Object.es6.js'),
  require.resolve('../vendor/polyfills/console.js'),
  require.resolve('../vendor/polyfills/error-guard.js'),
  require.resolve('../vendor/polyfills/Number.es6.js'),
  require.resolve('../vendor/polyfills/String.prototype.es6.js'),
  require.resolve('../vendor/polyfills/Array.prototype.es6.js'),
  require.resolve('../vendor/polyfills/Array.es6.js'),
  require.resolve('../vendor/polyfills/Object.es7.js'),
  require.resolve('../vendor/polyfills/babelHelpers.js'),
];
