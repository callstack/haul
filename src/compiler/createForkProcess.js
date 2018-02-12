/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

import type { Platform } from '../types';

const spawn = require('child_process').spawn;
const path = require('path');

type ConfigOptions = {
  root: string,
  dev: boolean,
  minify: boolean,
  port: number,
  platform: Platform,
};

type Options = {
  configPath: string,
  configOptions: ConfigOptions,
};

module.exports = function createForkProcess(
  platform: Platform,
  rootDir: string,
  address: string,
  options: Options
) {
  const workerPath = path.resolve(rootDir, 'worker/index.js');
  const child = spawn(process.execPath, [workerPath], {
    cwd: process.cwd(),
    env: {
      HAUL_PLATFORM: platform,
      HAUL_DIRECTORY: path.join(rootDir, 'worker'),
      HAUL_OPTIONS: JSON.stringify(options),
      HAUL_SOCKET_ADDRESS: address,
    },
    stdio: [0, 1, 2],
  });

  child.on('error', error => {
    throw error;
  });

  return child;
};
