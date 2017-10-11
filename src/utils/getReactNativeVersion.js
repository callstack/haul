/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const resolveCwd = require('resolve-cwd');
const fs = require('fs');
const logger = require('../logger');

/**
* Search top-most node_modules for React Native
* and return it's version
*/

module.exports = (): string => {
  let rnVersion = '';
  try {
    const pckJsonLocation = resolveCwd('react-native/package.json');
    rnVersion = JSON.parse(fs.readFileSync(pckJsonLocation, 'utf-8')).version;
  } catch (error) {
    logger.warn(error.toString());
  }

  return rnVersion;
};
