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
  const bundlePath = path.resolve(
    TEST_PROJECT_DIR,
    platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle'
  );
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'bundle',
    '--platform',
    platform,
  ]);
  // $FlowFixMe
  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }

  return bundlePath;
}

export function cleanup(platform: string) {
  const filename =
    platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle';
  rimraf.sync(path.resolve(TEST_PROJECT_DIR, filename));
  rimraf.sync(path.resolve(TEST_PROJECT_DIR, `${filename}.map`));
}
