/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const child_process = require('child_process'); // eslint-disable-line camelcase

function exec(args: string) {
  return new Promise((resolve, reject) => {
    child_process.exec(args, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr));
      } else {
        resolve();
      }
    });
  });
}

module.exports = exec;
