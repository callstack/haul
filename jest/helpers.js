/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

'use strict';

const traverse = require('traverse'); // eslint-disable-line
const path = require('path');
const excapeStringRegex = require('escape-string-regexp');

const flushPromises = (): Promise<any> =>
  new Promise(resolve => setTimeout(resolve));

const replacePathsInObject = (object: mixed) => {
  return traverse(object).map(
    entry =>
      typeof entry === 'string'
        ? entry
            .replace(/\/.*\/node_modules/, '<<NODE_MODULE>>')
            .replace(
              new RegExp(
                `^${excapeStringRegex(path.resolve(__dirname, '..'))}`
              ),
              '<<REPLACED>>'
            )
        : entry
  );
};

module.exports = {
  flushPromises,
  replacePathsInObject,
};
