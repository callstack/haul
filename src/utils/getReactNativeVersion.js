/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const resolveCwd = require('resolve-cwd');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
* Search top-most node_modules for React Native
* and return it's version
*/

module.exports = (root: string): string => {
  let rnVersion = '';
  try {
    const pkgJsonLocation = resolveCwd(
      path.join(root, 'node_modules', 'react-native', 'package.json'),
    );
    rnVersion = JSON.parse(fs.readFileSync(pkgJsonLocation, 'utf-8')).version;
  } catch (error) {
    logger.warn(error.toString());
  }

  return rnVersion;
};
