/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

import path from 'path';
import fetch from 'node-fetch';
import stripAnsi from 'strip-ansi';
import { run, yarnCommand } from '../utils';
import { runHaul } from '../runHaul';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react_native_with_haul'
);

describe('packager server', () => {
  let server;
  let disposed = false;

  beforeAll(done => {
    run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR);

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
