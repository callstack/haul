/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * Based on Jest: https://github.com/facebook/jest/blob/master/integration_tests/utils.js
 *
 * @flow
 */

const path = require('path');
const { spawn, spawnSync } = require('child_process');

const BIN_PATH = path.resolve(__dirname, '../bin/cli.js');

type RunHaulOptions = {
  nodePath?: string,
  skipPkgJsonCheck?: boolean, // don't complain if can't find package.json
};

function runHaulSync(
  dir: string,
  args?: Array<string>,
  options: RunHaulOptions = {}
) {
  let cwd = dir;
  const isRelative = cwd[0] !== '/';

  if (isRelative) {
    cwd = path.resolve(__dirname, cwd);
  }

  const env = options.nodePath
    ? Object.assign({}, process.env, { NODE_PATH: options.nodePath })
    : process.env;

  const result = spawnSync('node', [BIN_PATH, ...(args || [])], { cwd, env });

  result.stdout = result.stdout.toString();
  result.stderr = result.stderr.toString();

  return result;
}

function runHaul(
  dir: string,
  args?: Array<string>,
  options: RunHaulOptions = {}
) {
  let cwd = dir;
  const isRelative = cwd[0] !== '/';

  if (isRelative) {
    cwd = path.resolve(__dirname, cwd);
  }

  const env = options.nodePath
    ? Object.assign({}, process.env, { NODE_PATH: options.nodePath })
    : process.env;

  return spawn('node', [BIN_PATH, ...(args || [])], { cwd, env });
}

module.exports = {
  runHaul,
  runHaulSync,
};
