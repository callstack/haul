/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const resolveFrom = require('resolve-from');
const fs = require('fs');
const logger = require('../logger');

/**
* Search top-most node_modules for React Native
* and return it's version
*/

module.exports = (root: string): string => {
  let rnVersion = '';
  try {
    const pkgJsonLocation = resolveFrom(root, 'react-native/package.json');
    rnVersion = JSON.parse(fs.readFileSync(pkgJsonLocation, 'utf-8')).version;
  } catch (error) {
    logger.warn(error.toString());
  }

  return rnVersion;
};
