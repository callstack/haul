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
            .replace(
              new RegExp(`^${excapeStringRegex(path.resolve('/'))}`),
              '/'
            )
            .replace(new RegExp('\\\\', 'g'), '/')
            .replace(/\/.*\/node_modules/, '<<NODE_MODULE>>')
            .replace(
              new RegExp(
                process.platform === 'win32'
                  ? `^${excapeStringRegex(
                      path
                        .resolve(__dirname, '..')
                        .slice(2)
                        .replace(new RegExp('\\\\', 'g'), '/')
                    )}`
                  : `^${excapeStringRegex(path.resolve(__dirname, '..'))}`
              ),
              '<<REPLACED>>'
            )
        : entry
  );
};

const fixWorkers = (object: mixed) => {
  return traverse(object).map(entry => {
    if (typeof entry === 'object' && 'workers' in entry) {
      return Object.assign({}, entry, { workers: '<<CPUS>>' });
    }

    return entry;
  });
};

module.exports = {
  flushPromises,
  replacePathsInObject,
  fixWorkers,
};
