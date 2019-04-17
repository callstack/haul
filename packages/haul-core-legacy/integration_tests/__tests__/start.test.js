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
const { run, yarnCommand } = require('../utils');
const fetch = require('node-fetch');
const stripAnsi = require('strip-ansi');
const { isPortTaken } = require('../../src/utils/haulPortHandler');

const TEMP_DIR = path.resolve(os.tmpdir(), 'start_test');
const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react-native-with-haul'
);

let haul;
beforeAll(async done => {
  const isTaken = await isPortTaken(8081);
  if (isTaken) {
    done.fail('Port is already in use. Cannot run Haul in test env');
  }

  run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR);
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

test('starts server and bundling iOS platform', () => testPlatform('ios'));

test('starts server and bundling Android platform', () =>
  testPlatform('android'));

test('starts server and bundling all platforms', () =>
  Promise.all([testPlatform('ios'), testPlatform('android')]));

async function testPlatform(platform) {
  const res = await fetch(`http://localhost:8081/index.${platform}.bundle`);
  const bundle = await res.text();
  expect(bundle).toMatch('__webpack_require__');
}
