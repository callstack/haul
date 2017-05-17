/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * polyfillEnvironment.js
 *
 * This file is loaded as a part of user bundle
 */

/* eslint-disable import/no-extraneous-dependencies */
require('../../vendor/polyfills/console.js');
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

require('InitializeCore');
