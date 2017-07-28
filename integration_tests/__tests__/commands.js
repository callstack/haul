/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const runHaul = require('../runHaul');
const { cleanup, writeFiles } = require('../utils');
const path = require('path');
const os = require('os');

const DIR = path.resolve(os.tmpdir(), 'commands_test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('start command displays "Select platform" message', () => {
  writeFiles(DIR, {
    'webpack.haul.js': '{}',
  });

  const { stdout } = runHaul(DIR, ['start', '--platform ios']);
  expect(stdout).toMatchSnapshot();
});
