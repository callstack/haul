/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const resolver = require('resolve');

/**
* Resolves the path to a given module
* We point to 'package.json', then remove it to receive a path to the directory itself
*/

module.exports = (root: string, name: string) =>
  resolver
    .sync(`${name}/package.json`, { basedir: root })
    .replace('/package.json', '');
