/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const morgan = require('morgan');
const chalk = require('chalk');

morgan.token('path', req => req.path);

module.exports = morgan((tokens, req, res) => {
  return [
    chalk.cyan(tokens.method(req, res)),
    chalk.grey(req.path),
    chalk.grey(tokens.status(req, res)),
    chalk.grey(tokens.res(req, res, 'content-length'), '-'),
    chalk.grey(tokens['response-time'](req, res), 'ms')
  ].join(' ');
});
