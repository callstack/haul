/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const morgan = require('morgan');
const logger = require('../../logger');

module.exports = morgan((tokens, req, res) => {
  return logger.debug(
    tokens.method(req, res),
    req.path,
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms'
  );
});
