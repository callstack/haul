/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const dedent = require('dedent');

const getRequestBundleData = require('../util/getRequestBundleData');

function missingBundleMiddleware(req, res, next) {
  const bundleData = getRequestBundleData(req);

  if (bundleData) {
    res.status(500).end(
      dedent`
      Couldn't load bundle

      Make sure that Haul is running with --platform all or --platform ${
        bundleData.platform
      }
    `
    );
    return;
  }

  next();
}

module.exports = missingBundleMiddleware;
