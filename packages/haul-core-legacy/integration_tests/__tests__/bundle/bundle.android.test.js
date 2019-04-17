/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const fs = require('fs');
const { run, yarnCommand } = require('../../utils');
const { bundleForPlatform, TEST_PROJECT_DIR, cleanup } = require('./utils');

beforeAll(() => run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR));
beforeEach(() => cleanup('android'));
afterAll(() => cleanup('android'));

test('bundle android project', () => {
  const bundlePath = bundleForPlatform('android');
  expect(fs.existsSync(bundlePath)).toBeTruthy();
});
