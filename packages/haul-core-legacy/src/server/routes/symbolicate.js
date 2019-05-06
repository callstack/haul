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
import { Router, type $Request } from 'express';
import type {
  ReactNativeStackFrame,
  ReactNativeStack,
  Platform,
} from '../../types';

const SourceMapConsumer = require('source-map').SourceMapConsumer;
const fetch = require('node-fetch');
const Compiler = require('../../compiler/Compiler');
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
async function createSourceMapConsumer(compiler: Compiler, url: string) {
  const response = await fetch(url);
  const sourceMap = await response.text();

  // we stop here if we couldn't find that map
  if (!sourceMap) {
    logger.warn(messages.sourceMapFileNotFound());
    return null;
  }

  // feed the raw source map into our consumer
  try {
    return new SourceMapConsumer(sourceMap);
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
      /(__webpack_require__|haul|eval(JS){0,1})/
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
module.exports = function create(compiler: Compiler) {
  const router = Router();

  router.post('/symbolicate', async (req: $Request, res) => {
    // grab the source stack frames
    const unconvertedFrames = getRequestedFrames(req);
    if (!unconvertedFrames || unconvertedFrames.length === 0) {
      return res.sendStatus(400);
    }

    // grab the platform and filename from the first frame (e.g. index.ios.bundle?platform=ios&dev=true&minify=false:69825:16)
    const filenameMatch = unconvertedFrames[0].file.match(/\/(\D+)\?/);
    const platformMatch = unconvertedFrames[0].file.match(
      /platform=([a-zA-Z]*)/
    );

    const filename: ?string = filenameMatch && filenameMatch[1];
    const platform: ?Platform = (platformMatch && platformMatch[1]: any);

    if (!filename || !platform) {
      return res.sendStatus(400);
    }

    const [name, ...rest] = filename.split('.');
    const bundleName = `${name}.${platform}.${rest[rest.length - 1]}`;

    // grab our source map consumer
    const consumer = await createSourceMapConsumer(
      compiler,
      // $FlowFixMe
      `http://localhost:${req.get('host').split(':')[1]}/${bundleName}.map`
    );

    if (!consumer) {
      return res.sendStatus(500);
    }

    // the base directory
    // const root = getConfig(configPath, configOptions, platform).context;
    let convertedFrames = [];
    try {
      // error error on the wall, who's the fairest stack of all?
      convertedFrames = unconvertedFrames.map(
        (originalFrame): ReactNativeStackFrame => {
          if (
            originalFrame.lineNumber === null ||
            originalFrame.column === null
          ) {
            return originalFrame;
          }

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

          // convert these to a format which React Native wants
          return {
            lineNumber: lookup.line,
            column: lookup.column,
            file: lookup.source,
            methodName: originalFrame.methodName,
          };
        }
      );
    } catch (error) {
      logger.error(error);
    }

    // send it back to React Native
    const responseObject: ReactNativeSymbolicateResponse = {
      stack: convertedFrames,
    };
    const response = JSON.stringify(responseObject);
    res.send(response);
  });

  return router;
};
