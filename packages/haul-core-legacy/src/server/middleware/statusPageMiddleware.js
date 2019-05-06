/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * React Native client checks if packager is running
 * at the URL requested to determine whether bundle
 * loading can begin
 */
function statusPageMiddleware(req, res, next) {
  if (req.cleanPath === '/status') {
    res.end('packager-status:running');
    return;
  }
  next();
}

module.exports = statusPageMiddleware;
