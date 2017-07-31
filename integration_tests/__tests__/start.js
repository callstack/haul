/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaul, runHaulSync } = require('../runHaul');
const { cleanup, writeFiles, replaceTestPath } = require('../utils');
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
  jest.setTimeout(20000);
  expect.assertions(1);
  const messageBuffer = [];
  const haul = runHaul(TEST_PROJECT_DIR, ['start', '--platform', platform]);

  haul.stdout.on('data', data => {
    const message = stripAnsi(data.toString()).trim();
    if (message.length > 0) {
      messageBuffer.push(message);
    }

    if (message.match('Built successfully!')) {
      expect(replaceTestPath(messageBuffer.join('\n'))).toMatchSnapshot();
      done();
      haul.kill();
    }
  });
}
