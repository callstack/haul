import path from 'path';
import { spawnSync } from 'child_process';
import { ExecOutput } from './common';

const NYC_BIN = path.resolve(__dirname, '../../node_modules/.bin/nyc');
const NYC_ARGS = [
  '--silent',
  '--no-clean',
  '--exclude-after-remap',
  'false',
  '--cwd',
  path.join(__dirname, '../../'),
];

function getEnv() {
  return {
    ...process.env,
    NODE_ENV: 'development',
  };
}

export function runProcessSync(dir: string, args: Array<string>): ExecOutput {
  let cwd = dir;
  const isRelative = cwd[0] !== '/';

  if (isRelative) {
    cwd = path.resolve(__dirname, cwd);
  }

  const result = spawnSync(NYC_BIN, [...NYC_ARGS, ...args], {
    cwd,
    env: getEnv(),
  });

  return {
    ...result,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}
