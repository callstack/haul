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

        Try the following to fix the issue:
        - Ensure that Haul is running with --platform all or --platform ${platform}
        - Ensure that bundle has compiled successfuly by checking terminal window where Haul is running
      `,
      );
      return;
    }

    next();
  };
}

module.exports = missingBundleMiddleware;
