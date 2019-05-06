/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');

const resolvePath = (relativeFilePathArray: string[]) =>
  relativeFilePathArray
    // Remove our polyfill
    .slice(1)
    .map(entry => path.resolve(process.cwd(), entry));

const handleMultipleEntries = (multiEntry: *) => {
  if (Array.isArray(multiEntry)) {
    return resolvePath(multiEntry);
  }
  if (typeof multiEntry === 'object' && multiEntry !== null) {
    const entryKeys = Object.keys(multiEntry);
    return entryKeys.reduce((fileArray, key) => {
      const entry = multiEntry[key];
      if (typeof entry === 'string') {
        fileArray.push(entry);
        return fileArray;
      }

      const tempArr = resolvePath(entry);
      fileArray.push(`(chunk: ${key})`, ...tempArr);
      return fileArray;
    }, []);
  }

  return multiEntry;
};

function getEntryFiles(userEntry: *) {
  if (typeof userEntry === 'string') {
    return path.join(process.cwd(), userEntry);
  }
  if (
    Array.isArray(userEntry) ||
    (typeof userEntry === 'object' && userEntry !== null)
  ) {
    return handleMultipleEntries(userEntry).join('\n');
  }

  return userEntry;
}

module.exports = getEntryFiles;
