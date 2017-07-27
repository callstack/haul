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
import type { $Request, Middleware } from 'express';
import type { ReactNativeStackFrame, ReactNativeStack } from '../../types';

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const path = require('path');
const delve = require('dlv');
const messages = require('../../messages');
const logger = require('../../logger');

type ReactNativeSymbolicateRequest = {
  stack: ReactNativeStack,
};

type ReactNativeSymbolicateResponse = {
  stack: ReactNativeStack,
};

/**
 * Creates a SourceMapConsumer so we can query it.
 */
function createSourceMapConsumer(compiler: *) {
  // turns /path/to/use into 'path.to.use'
  const outputPath: string = compiler.options.output.path;
  const hops: Array<string> = outputPath
    .split(path.sep)
    .filter((pathPart: string) => pathPart !== ''); // no blanks please

  // grab the base directory out of webpack's deeply nested filesystem
  const base = delve(compiler.outputFileSystem.data, hops);

  // grab the Buffer for the source map
  const sourceMapBuffer =
    base && base[`${compiler.options.output.filename}.map`];

  // we stop here if we couldn't find that map
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
function getRequestedFrames(req: $Request): ?ReactNativeStack {
  if (typeof req.rawBody !== 'string') {
    return null;
  }

  let stack;

  try {
    const payload: ReactNativeSymbolicateRequest = JSON.parse(req.rawBody);
    stack = payload.stack;
  } catch (err) {
    // should happen, but at least we won't die
    stack = null;
  }

  if (!stack) return null;

  const newStack = stack.filter(stackLine => {
    const { methodName } = stackLine;
    const unwantedStackRegExp = new RegExp(
      /(__webpack_require__|haul|eval(JS){0,1})/,
    );

    if (unwantedStackRegExp.test(methodName)) return false; // we don't need those

    const evalLine = methodName.indexOf('Object../');
    if (evalLine > -1) {
      const newMethodName = methodName.slice(evalLine + 9); // removing this prefix in method names
      stackLine.methodName = newMethodName; // eslint-disable-line
    }
    return true;
  });

  return newStack;
}

/**
 * Create an Express middleware for handling React Native symbolication requests
 */
function create(compiler: *): Middleware {
  /**
   * The Express middleware for symbolicatin'.
   */
  function symbolicateMiddleware(req: $Request, res, next) {
    if (req.path !== '/symbolicate') return next();

    // grab our source map consumer
    const consumer = createSourceMapConsumer(compiler);
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

        // If lookup fails, we get the same shape object, but with
        // all values set to null
        if (lookup.source == null) {
          // It is better to gracefully return the original frame
          // than to throw an exception
          return originalFrame;
        }

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
