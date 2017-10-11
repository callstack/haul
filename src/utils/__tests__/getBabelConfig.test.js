/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const getBabelConfig = require('../getBabelConfig');
const traverse = require('traverse');

const orignalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = orignalEnv;
});

test('extracts config from .babelrc', () => {
  const cwd = path.resolve(__dirname, './fixtures');
  const config = getBabelConfig(cwd);
  expect(config).toMatchObject({
    extends: path.resolve(cwd, '.babelrc'),
  });
});

test('creates new config when no .babelrc found', () => {
  const cwd = path.resolve('mocked/path');
  const config = getBabelConfig(cwd);
  expect(
    traverse(config).map(
      entry =>
        typeof entry === 'string'
          ? entry
              .replace(/\/.*\/src/, '<<REPLACED>>')
              .replace(/\/.*\/node_modules/, '<<NODE_MODULE>>')
          : entry,
    ),
  ).toMatchSnapshot();
});

test('does not include "hot" plugins in production', () => {
  process.env.NODE_ENV = 'production';
  const cwd = path.resolve('mocked/path');
  const config = getBabelConfig(cwd);
  expect(
    traverse(config).map(
      entry =>
        typeof entry === 'string'
          ? entry
              .replace(/\/.*\/src/, '<<REPLACED>>')
              .replace(/\/.*\/node_modules/, '<<NODE_MODULE>>')
          : entry,
    ),
  ).toMatchSnapshot();
});
