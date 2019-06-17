/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const { cleanup } = require('../utils');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
const stripAnsi = require('strip-ansi');
const { spawn } = require('child_process');

const TEMP_DIR = path.join(os.tmpdir(), 'haul-start-');
const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react_native_with_haul'
);
const BIN = path.join(__dirname, '../runStart.js');

describe('packager server', () => {
  let server;
  beforeAll(done => {
    server = spawn('node', [BIN, TEST_PROJECT_DIR], {
      env: process.env,
      stdio: 'pipe',
      cwd: TEST_PROJECT_DIR,
    });

    server.stderr.on('data', data => {
      done.fail(data.toString());
    });

    server.stdout.on('data', data => {
      const message = stripAnsi(data.toString()).trim();

      if (message.match(/RUNNING/g)) {
        done();
      }
    });
  });

  afterAll(() => {
    cleanup(TEMP_DIR);
    server.kill();
  });

  it('compile bundle for iOS platform', () => testPlatform('ios'));

  it('compile bundle for Android platform', () => testPlatform('android'));

  it('compile bundle for both platforms', () =>
    Promise.all([testPlatform('ios'), testPlatform('android')]));
});

async function testPlatform(platform) {
  const res = await fetch(`http://localhost:8081/index.${platform}.bundle`);
  const bundle = await res.text();
  expect(bundle).toMatch('__webpack_require__');
}
