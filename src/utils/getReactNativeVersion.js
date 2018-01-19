/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const path = require('path');

module.exports = function getReactNativeVersion(cwd: string) {
  try {
    const pak = require(path.join(
      cwd,
      'node_modules/react-native/package.json'
    ));

    return pak.version;
  } catch (e) {
    // Ignore
  }

  return null;
};
