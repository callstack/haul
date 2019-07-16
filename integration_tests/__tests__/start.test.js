/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import stripAnsi from 'strip-ansi';
import { cleanup } from '../utils';
import { runHaul } from '../runHaul';

const TEMP_DIR = path.join(os.tmpdir(), 'haul-start-');
const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react_native_with_haul'
);

describe('packager server', () => {
  let server;
  let disposed = false;

  beforeAll(done => {
    server = runHaul(TEST_PROJECT_DIR, ['start']);

    server.stderr.on('data', data => {
      done.fail(data.toString());
    });

    server.stdout.on('data', data => {
      const message = stripAnsi(data.toString()).trim();
      if (message.match(/error/g) && !disposed) {
        done.fail(message);
      } else {
        done();
      }
    });
  });

  afterAll(() => {
    cleanup(TEMP_DIR);
    disposed = true;
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
