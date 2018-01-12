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
    /*
      RN 0.52+ comes with experimental feature called Delta Bundles (from metro)
      So to overcome any issues with this feature, one needs to disable it DevMenu
    */
    if (platform === 'android' && /\.delta/.test(req.url)) {
      res
        .status(500)
        .send(
          'Currently Haul does not support Delta bundles. Please disable them in Dev Settings'
        );
    }

    req.url = req.url.replace(/index.bundle/, `index.${platform}.bundle`);
  }
  next();
};
