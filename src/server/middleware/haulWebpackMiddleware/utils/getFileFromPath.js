/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

module.exports = function getFileFromPath(path: string) {
  const fileRegExp = /\w+\.\w+\.bundle/i;

  const match = path.match(fileRegExp);
  if (match) {
    return match[0];
  }

  return null;
};
