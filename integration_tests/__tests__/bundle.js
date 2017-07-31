/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaulSync } = require('../runHaul');
const path = require('path');
const fs = require('fs');
const { cleanup, run } = require('../utils');

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../fixtures/react-native-generated-project',
);

beforeEach(() => {
  run('yarn', TEST_PROJECT_DIR);
  cleanup(path.resolve(TEST_PROJECT_DIR, 'dist'));
});

test('bundle ios project', () => {
  bundleForPlatform('ios');
});

test('bundle android project', () => {
  bundleForPlatform('android');
});

function bundleForPlatform(platform) {
  const bundlePath = path.resolve(
    TEST_PROJECT_DIR,
    'dist',
    `index.${platform}.bundle`,
  );
  runHaulSync(TEST_PROJECT_DIR, ['bundle', '--platform', platform]);
  expect(fs.existsSync(bundlePath));
}
