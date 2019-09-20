/**
 * Based on Jest: https://github.com/facebook/jest/blob/master/integration_tests/utils.js
 */

import path from 'path';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import { ExecOutput } from './common';

const BIN_PATH = path.resolve(__dirname, '../../packages/haul-cli/bin/haul.js');

type RunHaulOptions = {
  nodePath?: string;
  skipPkgJsonCheck?: boolean; // don't complain if can't find package.json
};

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

  const env = options.nodePath
    ? Object.assign({}, process.env, { NODE_PATH: options.nodePath })
    : process.env;

  const result = spawnSync('node', [BIN_PATH, ...(args || [])], {
    cwd,
    env,
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

  const env = options.nodePath
    ? Object.assign({}, process.env, { NODE_PATH: options.nodePath })
    : process.env;

  return spawn('node', [BIN_PATH, ...(args || [])], { cwd, env });
}
