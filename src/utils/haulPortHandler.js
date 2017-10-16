/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const net = require('net');
const exec = require('child_process').exec;

/*
 * Check if the port is already in use
 */
function isPortTaken(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const portTester = net
      .createServer()
      .once('error', () => {
        return resolve(true);
      })
      .once('listening', () => {
        portTester.close();
        resolve(false);
      })
      .listen(port);
  });
}

function killProcess(port: number): Promise<boolean> {
  /*
   * Based on platform, decide what service
   * should be used to find process PID
   */
  const serviceToUse =
    process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -n -i:${port} | grep LISTEN`;

  return new Promise(resolve => {
    /*
     * Find PID that is listening at given port
     */
    exec(serviceToUse, (error, stdout) => {
      if (error) {
        /*
         * Error happens if no process found at given port
         */
        resolve(false);
        return;
      }
      /*
       * If no error, port is in use
       * And that port is used only by one process
       */
      const PIDInfo = stdout
        .trim()
        .split('\n')[0]
        .split(' ')
        .filter(entry => entry);

      /* macOSX/Linux: PID is placed at index 1
       * Windows: PID is placed at last index
       */
      const index = process.platform === 'win32' ? PIDInfo.length - 1 : 1;

      const PID = PIDInfo[index];

      /*
       * Kill process
       */
      process.kill(PID);

      resolve(true);
    });
  });
}

module.exports = {
  isPortTaken,
  killProcess,
};
