/* eslint-disable import/prefer-default-export */
/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaulSync } = require('../../runHaul');
const path = require('path');
const rimraf = require('rimraf');

export const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul'
);

export function bundleForPlatform(platform: string) {
  const bundlePath = path.resolve(TEST_PROJECT_DIR, `index.${platform}.bundle`);
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'bundle',
    '--platform',
    platform,
  ]);
  // $FlowFixMe
  if (stdout.match(/ERROR/g)) {
    throw new Error(stdout);
  }

  return bundlePath;
}

export function cleanup(platform: 'ios' | 'android') {
  rimraf.sync(path.resolve(TEST_PROJECT_DIR, `index.${platform}.bundle`));
  rimraf.sync(path.resolve(TEST_PROJECT_DIR, `index.${platform}.bundle.map`));
}
