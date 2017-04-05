/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
function rawBodyMiddleware(req: *, res: *, next: *) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', chunk => {
    req.rawBody += chunk;
  });

  req.on('end', () => {
    next();
  });
}

module.exports = rawBodyMiddleware;
