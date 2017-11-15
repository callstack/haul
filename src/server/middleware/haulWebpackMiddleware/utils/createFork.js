/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const spawn = require('child_process').spawn;
const path = require('path');

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
    // ['--inspect=127.0.0.1:9225', webpackWorkerPath],
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
