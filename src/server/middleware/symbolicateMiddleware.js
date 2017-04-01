/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 *
 * --- OVERVIEW ---
 *
 *   When running in dev mode, React Native handles source map lookups by
 *   asking the packager to do it.
 *
 *   It does a POST to /symbolicate and passes the call stack and expects
 *   back the same structure, but with the appropriate lines, columns & files.
 *
 *   This is the express middleware which will handle that endpoint by reading
 *   the source map that is tucked away inside webpack's in-memory filesystem.
 *
 */

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const path = require('path');
const delve = require('dlv');
const messages = require('../../messages');
const logger = require('../../logger');

/**
 * React Native's version of a stack frame.
 */
type ReactNativeStackFrame = {
  // ths
  lineNumber: number,
  column: number,
  file: string,
  methodName: string,
};

/**
 * A list of React Native stack frames.
 */
type ReactNativeStack = Array<ReactNativeStackFrame>;

/**
 * The payload of a symbolicate request sent from React Native.
 */
type ReactNativeSymbolicateRequest = {
  stack: ReactNativeStack,
};

/**
 * The payload that is returned to React Native after we symbolicate.
 */
type ReactNativeSymbolicateResponse = {
  stack: ReactNativeStack,
};

/**
 * Create an Express middleware for handling React Native symbolication requests
 */
function create(compiler: any): Function {
  /**
   * Creates a SourceMapConsumer so we can query it.
   */
  function createSourceMapConsumer() {
    // In haul, webpack stores its bundled stuff in a memory file system. Let's
    // go grab the root object where we expect the source map to live.
    const hops: Array<string> = compiler.options.output.path
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
      const raw: string = sourceMapBuffer.toString();
      return new SourceMapConsumer(raw);
    } catch (err) {
      logger.error(messages.sourceMapInvalidFormat());
      return null;
    }
  }

  /**
   * Gets the stack frames that React Native wants us to convert.
   */
  function getRequestedFrames(req: any): ?ReactNativeStack {
    try {
      const payload: ReactNativeSymbolicateRequest = JSON.parse(req.body);
      return payload.stack;
    } catch (err) {
      // should happen, but at least we won't die
      return null;
    }
  }

  /**
   * The Express middleware for symbolicatin'.
   */
  function symbolicateMiddleware(
    req: any,
    res: any,
    next: Function,
  ): ?Function {
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

    // error error on the wall, who's the fairest stack of all?
    const convertedFrames = unconvertedFrames.map(
      (originalFrame): ReactNativeStackFrame => {
        // find the original home of this line of code.
        const lookup = consumer.originalPositionFor({
          line: originalFrame.lineNumber,
          column: originalFrame.column,
        });

        // convert the original source into an absolute path
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
      },
    );

    // send it back to React Native
    const responseObject: ReactNativeSymbolicateResponse = {
      stack: convertedFrames,
    };
    const response = JSON.stringify(responseObject);
    res.end(response);

    return null;
  }

  return symbolicateMiddleware;
}

module.exports = create;
