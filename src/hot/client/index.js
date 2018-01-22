/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

/**
 * When imported, this module will setup almost everything needed for HMR or provide an API
 * for setting it up manualy in case of more advanced projects.
 * 
 * In production it will do nothing.
 */

if (!module.hot || process.env.NODE_ENV === 'production') {
  module.exports = {
    makeHot(rootFactory: Function) {
      /**
      * Return the original rootFactory and be quiet.
      */
      return rootFactory;
    },
    redraw() {},
    tryUpdateSelf() {},
    callOnce(callback: Function) {
      callback();
    },
    clearCacheFor() {},
  };
} else {
  global.__HAUL_HMR__ = global.__HAUL_HMR__ || {};
  require('./hotClient.js')({
    path: `${global.DEV_SERVER_ORIGIN || ''}/haul-hmr`,
    overlay: false,
  });
  module.exports = require('./hotApi');
}
