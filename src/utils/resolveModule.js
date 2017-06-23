/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const resolver = require('resolve');
const path = require('path');

/**
* Resolves the path to a given module
* We point to 'package.json', then remove it to receive a path to the directory itself
*/

module.exports = (root: string, name: string) => {
  const filePath = resolver.sync(`${name}/package.json`, { basedir: root });

  return path.dirname(filePath);
};
