/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
import type { Middleware, $Request } from 'express';

const fs = require('fs');
const dedent = require('dedent');
const logger = require('../../logger');
const chalk = require('chalk');

const systraceMiddleware: Middleware = (req: $Request, res, next) => {
  const path = `/tmp/react_native_${Date.now()}.json`;

  fs.writeFile(path, req.rawBody, err => {
    if (err) {
      next(err);
      return;
    }

    const message = dedent`
      We've saved the trace report at ${chalk.bold(path)}
      
      You can open the following trace report in Google Chrome by navigating to
      'chrome://tracing' and clicking 'load'.
    `;

    logger.log('\n');
    logger.info(message);
    logger.log('\n');

    res.end(message);
  });
};

module.exports = systraceMiddleware;
