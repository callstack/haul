/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { $Request } from 'express';
import type { Platform } from '../../types';

const logger = require('../../logger');

// Older versions of RN had the platform in the bundle name, which can be
// used as a fallback if the query parameter is missing. It's not clear when
// that was used, but as far as I can tell it only ever supported
// ios|android|web.
// That said, I don't think this should ever actually be used, (maybe
// platform-specific assets?) so allow anything.
const legacyPathPattern = /\.([^.]+)\.bundle$/;
const pathPattern = /\.(bundle|delta)$/;

export type BundleType = 'bundle' | 'delta';
export type BundleData = {
  type: BundleType,
  filename: string,
  platform: Platform,
};

module.exports = function getRequestBundleData(
  request: $Request
): null | BundleData {
  let match = request.path.match(pathPattern);

  // This isn't a bundle path.
  if (!match) {
    return null;
  }

  const type: BundleType = (match[1]: any);

  let platform: Platform = request.query.platform;

  // If the platform parameter is not provided, it might be a legacy RN bundle path...
  if (!platform) {
    match = request.path.match(legacyPathPattern);

    // Don't know what to do here, since the request has no platform to build for.
    if (!match) {
      logger.warn('Bundle request missing platform information.');
      return null;
    }

    platform = match[1];
  }

  // Normalize the filename so it matches what the webpack compiler is actually
  // outputting (by default). A better fix here would probably be to change the
  // default webpack configuration to match metro's behavior, which AFAICT
  // simply replaces the entry .js extension with .bundle. (compilers are
  // already separated by platform)

  // $FlowFixMe - Missing match result props: https://github.com/facebook/flow/issues/3554
  const basename = request.path.substring(1, match.index);
  const filename = `${basename}.${platform}.bundle`;

  return {
    type,
    filename,
    platform,
  };
};
