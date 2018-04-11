/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import path from 'path';
import { replacePathsInObject } from 'jest/helpers'; // eslint-disable-line import/no-unresolved
import {
  makeReactNativeConfig,
  injectPolyfillIntoEntry,
} from '../makeReactNativeConfig';

test('creates config from defaults', () => {
  // We need to go one level higher because of read polyfills with fs.readFileSync
  const orginalPath = __dirname;
  process.chdir(path.join(__dirname, '..'));

  const webpackConfig = require('./fixtures/haul.config.js');
  const iosConfig = makeReactNativeConfig(
    webpackConfig,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
    },
    'ios'
  );
  const androidConfig = makeReactNativeConfig(
    webpackConfig,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
    },
    'android'
  );

  expect(replacePathsInObject(iosConfig)).toMatchSnapshot('ios config');
  expect(replacePathsInObject(androidConfig)).toMatchSnapshot('android config');

  process.chdir(orginalPath);
});

test('merges existing config', () => {
  // We need to go one level higher because of read polyfills with fs.readFileSync
  const orginalPath = __dirname;
  process.chdir(path.join(__dirname, '..'));

  const webpackConfig = require('./fixtures/haul.config.custom.js');
  const config = makeReactNativeConfig(
    webpackConfig,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
    },
    'ios'
  );

  expect(replacePathsInObject(config)).toMatchSnapshot();

  process.chdir(orginalPath);
});

describe('injects polyfill into different entries', () => {
  const fakePolyfillPath = 'path/to/polyfill.js';

  test('entry is a string', () => {
    const userEntry = './src/index.js';
    const generatedEntry = injectPolyfillIntoEntry(userEntry, fakePolyfillPath);

    expect(generatedEntry.length).toBe(2);
    expect(generatedEntry[0]).toBe(fakePolyfillPath);
  });

  test('entry is an array', () => {
    const userEntry = ['./src/index.js', './src/module.js'];
    const generatedEntry = injectPolyfillIntoEntry(userEntry, fakePolyfillPath);

    expect(generatedEntry[0]).toBe(fakePolyfillPath);
    expect(generatedEntry.length).toBe(3);
  });

  test('entry is an object', () => {
    const userEntry = {
      entry1: './src/index.js',
      entry2: ['./src/module.js', './src/vendor.js'],
    };
    const expectedEntry1 = [fakePolyfillPath, './src/index.js'];

    const expectedEntry2 = [
      fakePolyfillPath,
      './src/module.js',
      './src/vendor.js',
    ];
    const generatedEntry = injectPolyfillIntoEntry(userEntry, fakePolyfillPath);

    expect(generatedEntry).toMatchObject({
      entry1: expectedEntry1,
      entry2: expectedEntry2,
    });
  });
});
