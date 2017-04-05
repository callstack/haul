/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const fs = require('fs');
const dedent = require('dedent');
const logger = require('../../logger');

/**
 * Systrace middleware
 */
function systraceMiddleware(req, res, next) {
  if (req.path !== '/systrace') {
    next();
    return;
  }

  const path = `/tmp/react_native_${Date.now()}.json`;

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
}

module.exports = systraceMiddleware;
