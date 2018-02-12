/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { $Response, $Request } from 'express';
import type { Platform } from '../../types';

const Compiler = require('../../compiler/Compiler');
const getRequestDataFromPath = require('../util/getRequestDataFromPath');
const runAdbReverse = require('../util/runAdbReverse');
const logger = require('../../logger');

type ConfigOptionsType = {
  root: string,
  dev: boolean,
  minify: boolean,
  port: number,
  platform: Platform,
};

type MiddlewareOptions = {
  configPath: string,
  configOptions: ConfigOptionsType,
};

module.exports = function createCompilerMiddleware(
  compiler: Compiler,
  options: MiddlewareOptions
) {
  function createCallback(response: $Response) {
    return ({ error, platform, file, mimeType }) => {
      if (error) {
        logger.error(`${platform}:\n`, error);
        response.type('text/javascript');
        response.status(500);
        response.end(error);
      } else {
        response.type(mimeType);
        response.send(file);
      }
    };
  }

  return function compilerMiddleware(
    request: $Request,
    response: $Response,
    next: Function
  ) {
    if (!/bundle$/.test(request.path)) {
      compiler.emit(Compiler.Events.REQUEST_FILE, {
        filename: request.path,
        callback: createCallback(response),
      });
    } else {
      const { filename, platform } = getRequestDataFromPath(request.path);
      if (!platform || !filename) {
        next();
        return;
      }

      if (platform === 'android') {
        const { port } = options && options.configOptions;
        runAdbReverse(port);
      }

      compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
        filename: request.path,
        platform,
        callback: createCallback(response),
      });
    }
  };
};
