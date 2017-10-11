/* eslint-disable import/prefer-default-export */
/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaulSync } = require('../../runHaul');
const path = require('path');
const fs = require('fs');

export const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react-native-with-haul',
);

export function bundleForPlatform(platform: string) {
  const bundlePath = path.resolve(
    TEST_PROJECT_DIR,
    'dist',
    `index.${platform}.bundle`,
  );
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'bundle',
    '--platform',
    platform,
  ]);
  // $FlowFixMe
  if (stdout.match(/ERROR/g)) {
    throw new Error(stdout);
  }

  expect(fs.existsSync(bundlePath)).toBe(true);
}
