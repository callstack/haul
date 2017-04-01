/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const path = require('path');
const delve = require('dlv');
const messages = require('../../messages');
const logger = require('../../logger');

/**
 * Create an Express middleware for handling React Native symbolication requests
 *
 * @param {*} compiler - WebPack compiler.
 * @return {function} The Express middleware.
 */
function create(compiler) {
  /**
   * Creates a SourceMapConsumer so we can query it.
   *
   * @return {SourceMapConsumer} The object we'll use for lookups.
   */
  function createSourceMapConsumer() {
    // In haul, webpack stores its bundled stuff in a memory file system. Let's
    // go grab the root object where we expect the source map to live.
    const hops = compiler.options.output.path
      .split(path.sep)
      .filter(x => x !== '');
    const base = delve(compiler.outputFileSystem.data, hops);

    // grab the Buffer for the source map
    const sourceMapBuffer = base &&
      base[`${compiler.options.output.filename}.map`];

    // jet if it's missing?
    if (!sourceMapBuffer) {
      logger.warn(messages.sourceMapFileNotFound());
      return null;
    }

    // feed the raw source map into our consumer
    try {
      const raw = sourceMapBuffer.toString();
      return new SourceMapConsumer(raw);
    } catch (err) {
      logger.error(messages.sourceMapInvalidFormat());
      return null;
    }
  }

  /**
   * Gets the stack frames that React Native wants us to convert.
   *
   * @param {*} req - The express request.
   * @return {[*]} An array of stack frames.
   */
  function getRequestedFrames(req) {
    try {
      return JSON.parse(req.body).stack;
    } catch (err) {
      // should happen, but at least we won't die
      return null;
    }
  }

  /**
   * The Express middleware for symbolicatin'.
   *
   * @param {*} req  - The inbound request.
   * @param {*} res  - The outbound response.
   * @param {*} next - The middleware chaining callback.
   */
  function symbolicateMiddleware(req, res, next) {
    // jet unless we're asked to symbolicate
    if (req.url !== '/symbolicate') return next();

    // grab our source map consumer or jet
    const consumer = createSourceMapConsumer();
    if (!consumer) return next();

    // grab the source stack frames
    const unconvertedFrames = getRequestedFrames(req);
    if (!unconvertedFrames) return next();

    // the base directory
    const root = compiler.options.context;

    // error error on the wall, who's fairest stack of all?
    const convertedFrames = unconvertedFrames.map(originalFrame => {
      // find the original home of this line of code.
      const lookup = consumer.originalPositionFor({
        line: originalFrame.lineNumber,
        column: originalFrame.column,
      });

      // convert the original source into an absolute path
      // TODO(steve): is this too naive?  it works, but am I missing something? almost seems
      // a bit too easy. :|
      const mappedFile = lookup.source
        .replace('webpack:///~', path.resolve(root, 'node_modules'))
        .replace('webpack://', root);

      // convert these to a format which React Native wants
      return {
        lineNumber: lookup.line,
        column: lookup.column,
        file: mappedFile,
        methodName: originalFrame.methodName,
      };
    });

    // send it back to React Native
    const responseObject = { stack: convertedFrames };
    const response = JSON.stringify(responseObject);

    // so long!
    res.end(response);

    // the linter wanted this because of the early returns way
    // up top... i will obey the linter.
    return null;
  }

  return symbolicateMiddleware;
}

module.exports = create;
