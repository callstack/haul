/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const dedent = require('dedent');

function missingBundleMiddleware(req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const [_, platform] = req.path.match(/(?:\.(ios|android))?\.bundle$/) || [];

  if (platform) {
    res.status(500).end(
      dedent`
      Couldn't load bundle

      Make sure that Haul is running with --platform all or --platform ${platform}
    `
    );
    return;
  }

  next();
}

module.exports = missingBundleMiddleware;
