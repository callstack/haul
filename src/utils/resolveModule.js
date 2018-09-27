/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const fs = require('fs');
const resolver = require('resolve');
/**
 * Resolves the real path to a given module
 * We point to 'package.json', then remove it to receive a path to the directory itself
 */

module.exports = (root: string, name: string) => {
  const filePath = resolver.sync(`${name}/package.json`, { basedir: root });
  const realPath = fs.realpathSync(filePath);
  return path.dirname(realPath);
};
