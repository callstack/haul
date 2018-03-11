/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { runHaul } = require('../runHaul');
const { cleanup } = require('../utils');
const path = require('path');
const os = require('os');
const { run } = require('../utils');
const fetch = require('node-fetch');
const stripAnsi = require('strip-ansi');

const TEMP_DIR = path.resolve(os.tmpdir(), 'start_test');
const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react-native-with-haul'
);

let haul;
beforeAll(done => {
  run('yarn --mutex network', TEST_PROJECT_DIR);
  haul = runHaul(TEST_PROJECT_DIR, ['start']);
  const messageBuffer = [];

  haul.stdout.on('data', data => {
    const message = stripAnsi(data.toString()).trim();

    if (message.length > 0) {
      messageBuffer.push(message);
    }

    if (message.match(/ERROR/g)) {
      done.fail(message);
    }

    if (message.match('running')) {
      done();
    }
  });
});
beforeEach(() => cleanup(TEMP_DIR));
afterEach(() => cleanup(TEMP_DIR));
afterAll(() => {
  haul.kill();
});

test('starts server and bundling iOS platform', done => {
  testPlatform('ios', done);
});

test('starts server and bundling Android platform', done => {
  testPlatform('android', done);
});

test('starts server and bundling all platforms', done => {
  let calledTimes = 0;
  function _done() {
    calledTimes++;
    if (calledTimes === 2) {
      done();
    }
  }
  _done.fail = done.fail;

  testPlatform('ios', _done);
  testPlatform('android', _done);
});

async function testPlatform(platform, done) {
  try {
    const res = await fetch(`http://localhost:8081/index.${platform}.bundle`);
    const bundle = await res.text();
    expect(bundle).toMatch('__webpack_require__');
    done();
  } catch (error) {
    done.fail(error);
  }
}
