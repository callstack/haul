/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

function cleanPathMiddleware(req, res, next) {
  req.cleanPath = req.path.replace(/\/$/, '');

  next();
}

module.exports = cleanPathMiddleware;
