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
  '../../fixtures/react-native-with-haul'
);

beforeAll(() => run('yarn --mutex network', TEST_PROJECT_DIR));
beforeEach(() => cleanup(TEMP_DIR));
afterEach(() => cleanup(TEMP_DIR));

test('start command displays "Select platform" message', () => {
  writeFiles(TEMP_DIR, {
    'webpack.haul.js': '{}',
  });

  const { stdout } = runHaulSync(TEMP_DIR, ['start']);
  expect(stripAnsi(stdout).trim()).toMatchSnapshot();
});

test('starts server and bundling iOS platform', done => {
  testPlatform('ios', /ios/i, done);
});

test('starts server and bundling Android platform', done => {
  testPlatform('android', /android/i, done);
});

test('starts server and bundling all platforms', done => {
  testPlatform('all', /ios.*\n.*android/i, done);
});

function testPlatform(platform, matchRegex, done) {
  expect.hasAssertions();
  const messageBuffer = [];
  const haul = runHaul(TEST_PROJECT_DIR, ['start', '--platform', platform]);

  haul.stdout.on('data', data => {
    const message = stripAnsi(data.toString()).trim();

    if (message.length > 0) {
      messageBuffer.push(message);
    }

    if (message.match(/ERROR/g)) {
      done.fail(message);
      haul.kill();
    }

    if (message.match(matchRegex)) {
      const stdout = messageBuffer.join('\n');
      expect(stdout).toMatch('INFO  Ready at http://localhost:8081');
      expect(stdout).toMatch(
        'Haul is now bundling your React Native app, starting from'
      );
      done();
      haul.kill();
    }
  });
}
