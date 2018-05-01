/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { Platform } from '../../types';

module.exports = function getRequestDataFromPath(path: string) {
  const fileRegExp = /\w+\.(.*)\.bundle/i;

  const match = path.match(fileRegExp);
  if (match) {
    const platform: Platform = (match[1]: any);
    return {
      filename: match[0],
      platform,
    };
  }

  return { filename: null, platform: null };
};
