// @flow

const messages = require('../messages');
const logger = require('../logger');

/**
 * Get the proper webpack compiler.
 *
 * Since Haul can be run for a single platform (--platform ios|android) or multiple (--platform all),
 * the passed in compiler might be a `MultiCompiler` instance which holds an array of compilers.
 *
 * @param {*} compiler The Webpack compiler passed into the express middleware.
 * @param {?string} platform The platform to use.
 */
module.exports = function getCompilerByPlatform(
  webpackCompiler: *,
  platform: ?string,
): * {
  const isMulti = Boolean(webpackCompiler.compilers);

  // we're running in single-platform mode so all is right in the universe.
  if (!isMulti) {
    return webpackCompiler;
  }

  // find the right compiler based on the platform in the bundle's output filename (e.g. index.android.js)
  //   (see: makeReactNativeConfig.js -> getDefaultConfig)
  const compiler = webpackCompiler.compilers.find(
    c => c.options.output.filename.split('.')[1] === platform,
  );

  // sanity check
  if (!compiler) {
    logger.warn(messages.webpackCompilerPlatformNotFound(platform));
    // chances are pretty good this will be "ok", but platform-specific code won't be
    return webpackCompiler.compilers[0];
  }

  return compiler;
};
