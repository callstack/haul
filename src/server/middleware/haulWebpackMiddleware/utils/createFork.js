/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const spawn = require('child_process').spawn;
const path = require('path');

/**
 * 
 * @param {*} platform Specific platform: andro/ios
 * @param {*} fileOutput filename that will be used in output from webpack
 * @param {*} cwd where Haul was started (project root)
 * @param {*} middlewareDirectory path to Haul's middleware directory
 * @param {*} middlewareOptions options set on Haul startup, see MiddlewareOptions in haulWebpack/index.js
 * @param {*} socket TCP socket name for piping bundle
 */
module.exports = function createFork(
  platform: string,
  fileOutput: string,
  cwd: string,
  middlewareDirectory: string,
  middlewareOptions: Object,
  socket: string
) {
  const webpackWorkerPath = path.resolve(
    middlewareDirectory,
    'webpackWorker.js'
  );
  const child = spawn(
    process.execPath,
    // ['--inspect=127.0.0.1:9225', webpackWorkerPath], // debugging
    [webpackWorkerPath],
    {
      cwd,
      env: {
        HAUL_PLATFORM: platform,
        HAUL_FILEOUTPUT: fileOutput,
        HAUL_DIRECTORY: middlewareDirectory,
        HAUL_OPTIONS: JSON.stringify(middlewareOptions),
        HAUL_SOCKET: socket,
      },
      stdio: [0, 1, 2, 'ipc', 'pipe'],
    }
  );

  child.on('error', e => {
    console.log(`Child ${platform}: `, e.message);
  });

  return child;
};
