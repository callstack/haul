/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const fs = require('fs');
const path = require('path');

module.exports = function getReactNativeVersion(cwd: string) {
  try {
    const pak = JSON.parse(
      fs.readFileSync(path.join(cwd, 'package.json')).toString()
    );

    const deps = {
      ...(pak.dependencies || {}),
      ...(pak.devDependencies || {}),
      ...(pak.peerDependencies || {}),
    };

    return deps['react-native'];
  } catch (e) {
    // Ignore
  }
  return false;
};
