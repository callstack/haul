/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

'use strict';

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve));
}

module.exports = {
  flushPromises,
};
