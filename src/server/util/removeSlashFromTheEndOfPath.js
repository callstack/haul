/**
 * Copyright 2018-present, Callstack.
 * All rights reserved.
 */

function removeSlashFromTheEndOfPath(path) {
  return path.replace(/\/$/, '');
}

module.exports = removeSlashFromTheEndOfPath;
