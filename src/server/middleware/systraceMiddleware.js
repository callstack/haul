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

const howToOpenReport = dedent`
  You can open the trace report in Google Chrome by navigating to
  'chrome://tracing' and clicking 'load'.
`;

const systraceMiddleware: Middleware = (req: $Request, res, next) => {
  const path = `/tmp/haul_${Date.now()}.json`;

  // $FlowFixMe: `req.rawBody` is added by rawBodyMiddleware
  fs.writeFile(path, req.rawBody, err => {
    if (err) {
      next(err);
      return;
    }

    logger.info(
      dedent`
      We've saved the trace report at ${chalk.bold(path)}
      
      ${howToOpenReport} \n
    `,
    );

    res.end(
      dedent`
      We've saved the trace report at ${path}

      ${howToOpenReport}
    `,
    );
  });
};

module.exports = systraceMiddleware;
