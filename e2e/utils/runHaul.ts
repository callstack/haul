/**
 * Based on Jest: https://github.com/facebook/jest/blob/master/integration_tests/utils.js
 */

import path from 'path';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import { ExecOutput } from './common';

const BIN_PATH = path.resolve(__dirname, '../../packages/haul-cli/bin/haul.js');
const NYC_BIN = path.resolve(__dirname, '../../node_modules/.bin/nyc');
const NYC_ARGS = [
  '--silent',
  '--no-clean',
  '--exclude-after-remap',
  'false',
  '--cwd',
  path.join(__dirname, '../../'),
];

type RunHaulOptions = {
  nodePath?: string;
  skipPkgJsonCheck?: boolean; // don't complain if can't find package.json
};

function getEnv(options: RunHaulOptions) {
  return {
    ...process.env,
    ...(options.nodePath ? { NODE_PATH: options.nodePath } : {}),
    NODE_ENV: 'development',
  };
}

export function runHaulSync(
  dir: string,
  args?: Array<string>,
  options: RunHaulOptions = {}
): ExecOutput {
  let cwd = dir;
  const isRelative = cwd[0] !== '/';

  if (isRelative) {
    cwd = path.resolve(__dirname, cwd);
  }

  const result = spawnSync(NYC_BIN, [...NYC_ARGS, BIN_PATH, ...(args || [])], {
    cwd,
    env: getEnv(options),
  });

  return {
    ...result,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

export function runHaul(
  dir: string,
  args?: Array<string>,
  options: RunHaulOptions = {}
): ChildProcess {
  let cwd = dir;
  const isRelative = cwd[0] !== '/';

  if (isRelative) {
    cwd = path.resolve(__dirname, cwd);
  }

  return spawn(NYC_BIN, [...NYC_ARGS, BIN_PATH, ...(args || [])], {
    cwd,
    env: getEnv(options),
  });
}
