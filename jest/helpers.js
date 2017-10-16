/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

'use strict';

const traverse = require('traverse'); // eslint-disable-line

const flushPromises = () => new Promise(resolve => setTimeout(resolve));

const replacePathsInObject = (object: mixed) => {
  return traverse(object).map(
    entry =>
      typeof entry === 'string'
        ? entry
            .replace(/\/.*\/src/, '<<REPLACED>>')
            .replace(/\/.*\/node_modules/, '<<NODE_MODULE>>')
        : entry
  );
};

module.exports = {
  flushPromises,
  replacePathsInObject,
};
