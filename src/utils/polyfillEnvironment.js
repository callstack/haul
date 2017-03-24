/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * polyfillEnvironment.js
 */

/**
 * Polyfill `global` for React Native environment
 */
(function(global) {
  global.global = global;
  global.window = global;
})(
  typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined' ? self : this
);

/**
 * Load polyfills set by packager by default
 */
require('react-native/packager/src/Resolver/polyfills/polyfills.js');
require('react-native/packager/src/Resolver/polyfills/console.js');
require('react-native/packager/src/Resolver/polyfills/error-guard.js');
require('react-native/packager/src/Resolver/polyfills/Number.es6.js');
require('react-native/packager/src/Resolver/polyfills/String.prototype.es6.js');
require('react-native/packager/src/Resolver/polyfills/Array.prototype.es6.js');
require('react-native/packager/src/Resolver/polyfills/Array.es6.js');
require('react-native/packager/src/Resolver/polyfills/Object.es7.js');
require('react-native/packager/src/Resolver/polyfills/babelHelpers.js');
