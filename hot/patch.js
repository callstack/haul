/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

/**
 * Apply React patches in development by importing `haul/hot/patch`.
 */
if (module.hot && process.env.NODE_ENV !== 'production') {
  require('../src/hot/client/hotPatch');
}
