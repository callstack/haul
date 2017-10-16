/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import path from 'path';
import { replacePathsInObject } from 'jest/helpers'; // eslint-disable-line import/no-unresolved
import makeReactNativeConfig from '../makeReactNativeConfig';

test('creates config from defaults', () => {
  const webpackConfig = require('./fixtures/webpack.config.js');
  const [configs, platforms] = makeReactNativeConfig(webpackConfig, {
    dev: true,
    root: path.resolve(__dirname, 'fixtures'),
  });

  expect(replacePathsInObject(configs)).toMatchSnapshot(
    'creates config from defaults (configs)'
  );
  expect(platforms).toMatchSnapshot('creates config from defaults (platforms)');
});

test('merges existing config', () => {
  const webpackConfig = require('./fixtures/webpack.custom.config.js');
  const [configs] = makeReactNativeConfig(webpackConfig, {
    dev: true,
    root: path.resolve(__dirname, 'fixtures'),
  });

  expect(replacePathsInObject(configs)).toMatchSnapshot(
    'merges existing config'
  );
});
