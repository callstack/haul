/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
/* eslint-disable no-param-reassign */

const path = require('path');
const getPolyfills = require('./getPolyfills');

type WebpackEntry = string | Array<string> | Object;

function injectPolyfillIntoEntry({
  entry: userEntry,
  root,
  initializeCoreLocation = 'node_modules/react-native/Libraries/Core/InitializeCore.js',
  dev = true,
  disableHotReloading = false,
}: {
  entry: WebpackEntry,
  root: string,
  initializeCoreLocation?: string,
  dev?: boolean,
  disableHotReloading?: boolean,
}) {
  const reactNativeHaulEntries = [
    ...getPolyfills(),
    require.resolve(path.join(root, initializeCoreLocation)),
  ];

  if (dev && !disableHotReloading) {
    reactNativeHaulEntries.push(require.resolve('../../hot/patch.js'));
  }

  return makeWebpackEntry(userEntry, reactNativeHaulEntries);
}

function makeWebpackEntry(
  userEntry: WebpackEntry,
  otherEntries: Array<string>
): WebpackEntry {
  if (typeof userEntry === 'string') {
    return [...otherEntries, userEntry];
  }
  if (Array.isArray(userEntry)) {
    return [...otherEntries, ...userEntry];
  }
  if (typeof userEntry === 'object') {
    const chunkNames = Object.keys(userEntry);
    return chunkNames.reduce((entryObj: Object, name: string) => {
      // $FlowFixMe
      const chunk = userEntry[name];
      if (typeof chunk === 'string') {
        entryObj[name] = [...otherEntries, chunk];
        return entryObj;
      } else if (Array.isArray(chunk)) {
        entryObj[name] = [...otherEntries, ...chunk];
        return entryObj;
      }
      return chunk;
    }, {});
  }
  return userEntry;
}

module.exports = {
  injectPolyfillIntoEntry,
};
