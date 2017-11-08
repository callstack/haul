/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/* 
 * Changes the requested bundle name to `index.${platform}.bundle`
 * To keep compatibility with all RN versions
 */

import type { $Request, $Response } from 'express';

module.exports = function requestChangeMiddleware(
  req: $Request,
  res: $Response,
  next: *
) {
  const { platform } = req.query;
  if (platform) {
    req.url = req.url.replace('index.bundle', `index.${platform}.bundle`);
  }
  next();
};
