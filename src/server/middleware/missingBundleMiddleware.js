/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const MultiCompiler = require('webpack/lib/MultiCompiler');
const dedent = require('dedent');

function missingBundleMiddleware(compiler) {
  return (req, res, next) => {
    // In multi compiler mode, all entry points should be available
    if (compiler instanceof MultiCompiler) {
      next();
    }

    // eslint-disable-next-line no-unused-vars
    const [_, platform] = req.path.match(/(?:\.(ios|android))?\.bundle/) || [];

    if (platform) {
      res.status(500).end(
        dedent`
        Bundle couldn't be loaded.

        Check the following:
        1) Haul is running with '--platform all' or '--platform ${platform}' flag
        2) Check the Terminal window where Haul is running for any errors
      `,
      );
      return;
    }

    next();
  };
}

module.exports = missingBundleMiddleware;
