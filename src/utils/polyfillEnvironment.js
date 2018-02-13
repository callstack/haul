/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * polyfillEnvironment.js
 *
 * This file is loaded as a part of user bundle
 */

/* eslint-disable import/no-extraneous-dependencies */
require('../../vendor/polyfills/console.js')(global);
require('../../vendor/polyfills/error-guard.js');
require('../../vendor/polyfills/Number.es6.js');
require('../../vendor/polyfills/String.prototype.es6.js');
require('../../vendor/polyfills/Array.prototype.es6.js');
require('../../vendor/polyfills/Array.es6.js');
require('../../vendor/polyfills/Object.es6.js');
require('../../vendor/polyfills/Object.es7.js');
require('../../vendor/polyfills/babelHelpers.js');

// HACK:
//   This is horrible.  I know.  But this hack seems to be needed due to the way
//   React Native lazy evaluates `fetch` within `InitializeCore`.  This was fixed
//   in 34-ish, but seems to be back again.  I hope I'm wrong because I lost sleep
//   on this one.
//
//   Without this in place, global.fetch will be undefined and cause the symbolicate
//   check to fail.  This must be something that the packager is doing that haul isn't.
//   I also so people complaining about this in Jest as well.
//
if (!global.self) {
  global.self = global; /* eslint-disable-line */
}

require('InitializeCore'); // eslint-disable-line import/no-unresolved

require('../hot/client/importScriptsPolyfill');

const scriptURL = require('react-native').NativeModules.SourceCode.scriptURL; // eslint-disable-line import/no-unresolved
// In order to ensure hot client has a valid URL we need to get a valid origin
// from URL from which the bundle was loaded. When using iOS simulator/Android emulator
// or Android device it will be `localhost:<port>` but when using real iOS device
// it will be `<ip>.xip.io:<port>`. Thus the code below ensure we connect and download
// manifest/hot-update from a valid origin.
const match = scriptURL.match(/(^.+)\/index/);

global.DEV_SERVER_ORIGIN = match ? match[1] : null;
// Webpack's `publicPath` needs to be overwritten with `DEV_SERVER_ORIGIN` otherwise,
// it would still make requests to (usually) `localhost`.
__webpack_require__.p = `${global.DEV_SERVER_ORIGIN}/`; // eslint-disable-line no-undef
