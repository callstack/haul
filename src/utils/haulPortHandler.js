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

function isPortTaken(port: number) {
  return new Promise(resolve => {
    const portTester = net
      .createServer()
      .once('error', () => {
        return resolve(true);
      })
      .once('listening', () => {
        portTester
          .once('close', () => {
            resolve(false);
          })
          .close();
      })
      .listen(port);
  });
}

function killHaulProcess(port: number) {
  return new Promise(resolve => {
    /*
     * Find PID that is listening at given port
     */
    exec(`lsof -n -i:${port} | grep LISTEN`, (error, stdout) => {
      if (error) {
        resolve(false);
      }
      const PIDList = stdout.trim().split('\n');

      /* There can be only one PID using PORT */
      if (PIDList.length) {
        /* PID is placed at index 1, 0 is process name */
        const PID = PIDList[0].split(' ').filter(pidInfo => pidInfo)[1];
        /*
         * Kill Haul process
         */
        try {
          process.kill(PID);
        } catch (e) {
          resolve(false);
        }
        resolve(true);
      }
      resolve(false);
    });
  });
}

module.exports = {
  isPortTaken,
  killHaulProcess,
};
