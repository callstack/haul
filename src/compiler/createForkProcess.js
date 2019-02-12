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
  assetsDest: string,
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
  const child = spawn(process.execPath, ['--trace-warnings', workerPath], {
    cwd: process.cwd(),
    env: Object.assign({}, process.env, {
      HAUL_PLATFORM: platform,
      HAUL_DIRECTORY: path.join(rootDir, 'worker'),
      HAUL_OPTIONS: JSON.stringify(options),
      HAUL_SOCKET_ADDRESS: address,
    }),
    stdio: 'pipe',
  });

  child.stdout.on('data', data => {
    console.log(data.toString());
  });

  child.stderr.on('data', data => {
    console.error(data.toString());
  });

  child.on('error', error => {
    throw error;
  });

  return child;
};
