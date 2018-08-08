/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { $Response, $Request } from 'express';
import type { Platform } from '../../types';

const Compiler = require('../../compiler/Compiler');
const logger = require('../../logger');
const getRequestBundleData = require('../util/getRequestBundleData');
const createDeltaBundle = require('../util/createDeltaBundle');
const runAdbReverse = require('../util/runAdbReverse');

type ConfigOptionsType = {
  root: string,
  dev: boolean,
  minify: boolean,
  port: number,
  platform: Platform,
};

type MiddlewareOptions = {
  configPath: ?string,
  configOptions: ConfigOptionsType,
};

/**
 * Compiler middleware serves as a adapter between Compiler instance, which is a EventEmitter
 * and Express application.
 */
module.exports = function createCompilerMiddleware(
  compiler: Compiler,
  options: MiddlewareOptions
) {
  function createCallback(response: $Response) {
    return ({ errors, file, mimeType }) => {
      if (errors) {
        response.type('text/javascript');
        response.status(500);
        response.end(errors[0]); // Send only the first error.
      } else if (file) {
        response.type(mimeType);
        response
          .status(200)
          .send(file.type === 'Buffer' ? Buffer.from(file.data) : file);
      } else {
        response.sendStatus(404);
      }
    };
  }

  let hasRunAdbReverse = false;
  let hasWarnedDelta = false;

  return function compilerMiddleware(request: $Request, response: $Response) {
    // If the request doesn't end with .bundle or .delta, we assume it's just a regular file, hence the
    // `REQUEST_FILE` event is emitted. Otherwise we emit `REQUEST_BUNDLE` event.
    const bundleData = getRequestBundleData(request);
    if (!bundleData) {
      compiler.emit(Compiler.Events.REQUEST_FILE, {
        filename: request.path,
        callback: createCallback(response),
      });
    } else {
      const { type, platform, filename } = bundleData;

      if (!hasRunAdbReverse && platform === 'android') {
        const { port } = options && options.configOptions;
        runAdbReverse(port);
        hasRunAdbReverse = true;
      }

      const callback = createCallback(response);

      if (type !== 'delta') {
        compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
          filename,
          platform,
          callback,
        });
      } else {
        if (!hasWarnedDelta) {
          logger.warn(
            'Your app requested a delta bundle, this has minimal support in haul'
          );
          hasWarnedDelta = true;
        }

        compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
          filename,
          platform,
          callback(result) {
            if (result.errors || !result.file) {
              callback(result);
            } else {
              // We have a bundle, but RN is expecting a delta bundle.
              // Convert full bundle into the simplest delta possible.
              // This will load slower in RN, but it won't error, which is
              // nice for automated use-cases where changing the dev setting
              // is not possible.

              const file =
                result.file.type === 'Buffer'
                  ? Buffer.from(result.file.data).toString()
                  : result.file;

              callback({
                ...result,
                file: createDeltaBundle(file),
              });
            }
          },
        });
      }
    }
  };
};
