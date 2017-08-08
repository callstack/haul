/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const getBabelConfig = require('../getBabelConfig');

test('extracts config from .babelrc', () => {
  const cwd = path.resolve(__dirname, './fixtures');
  const config = getBabelConfig(cwd);
  expect(config).toEqual({
    babelrc: false,
    extends: path.resolve(cwd, '.babelrc'),
    plugins: [require.resolve('../fixRequireIssues')],
  });
});

test('creates new config when no .babelrc found', () => {
  const cwd = path.resolve('mocked/path');
  const config = getBabelConfig(cwd);
  expect(config).toEqual({
    babelrc: false,
    presets: ['react-native'],
    plugins: [require.resolve('../fixRequireIssues')],
  });
});
