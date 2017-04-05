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

const systraceMiddleware: Middleware = (req: $Request, res, next) => {
  if (req.path !== '/systrace') {
    next();
    return;
  }

  const path = `/tmp/react_native_${Date.now()}.json`;

  // $FlowFixMe: rawBodyMiddleware adds `rawBody` to all requests
  fs.writeFileSync(path, req.rawBody);

  logger.debug('Systrace', `/tmp/react_native_${Date.now()}.json`);

  res.end(
    dedent`
    Your trace report was saved at ${path}.
    
    You can open it with Google Chrome by navigating to 'chrome://tracing'
    and clicking 'load'.

    The path to the report was printed by Haul in your Terminal so you can
    copy it.
  `,
  );
};

module.exports = systraceMiddleware;
