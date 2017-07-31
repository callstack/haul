/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaul, runHaulSync } = require('../runHaul');
const { cleanup, writeFiles } = require('../utils');
const path = require('path');
const os = require('os');
const { run } = require('../utils');
const stripAnsi = require('strip-ansi');

const TEMP_DIR = path.resolve(os.tmpdir(), 'start_test');
const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../fixtures/react-native-generated-project',
);

beforeAll(() => {
  run('yarn', TEST_PROJECT_DIR);
});

beforeEach(() => cleanup(TEMP_DIR));
afterEach(() => cleanup(TEMP_DIR));

test('start command displays "Select platform" message', () => {
  writeFiles(TEMP_DIR, {
    'webpack.haul.js': '{}',
  });

  const { stdout } = runHaulSync(TEMP_DIR, ['start']);
  expect(stdout).toMatchSnapshot();
});

test('start --platform ios', done => {
  testPlatform('ios', done);
});

test('start --platform android', done => {
  testPlatform('android', done);
});

function testPlatform(platform, done) {
  expect.assertions(4);
  const messageBuffer = [];
  const haul = runHaul(TEST_PROJECT_DIR, ['start', '--platform', platform]);

  haul.stdout.on('data', data => {
    const message = stripAnsi(data.toString()).trim();
    if (message.length > 0) {
      messageBuffer.push(message);
    }

    if (message.match('Built successfully!')) {
      const stdout = messageBuffer.join('\n');
      expect(stdout).toMatch('INFO  Ready at http://localhost:8081');
      expect(stdout).toMatch('Haul is now bundling your React Native app');
      expect(stdout).toMatch('A fresh build may take longer than usual');
      expect(stdout).toMatch(
        `You can now run the app on your ${platform} device`,
      );
      done();
      haul.kill();
    }
  });
}
