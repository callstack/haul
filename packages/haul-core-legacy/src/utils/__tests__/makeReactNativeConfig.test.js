/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import path from 'path';
import snapshotDiff from 'snapshot-diff';
import { replacePathsInObject } from 'jest/helpers'; // eslint-disable-line import/no-unresolved
import {
  makeReactNativeConfig,
  injectPolyfillIntoEntry,
} from '../makeReactNativeConfig';

describe('makeReactNativeConfig', () => {
  it('creates config from defaults', () => {
    const webpackConfig = require('./fixtures/haul.config.js');
    const iosConfig = makeReactNativeConfig(
      webpackConfig,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
        assetsDest: path.resolve(__dirname, 'fixtures'),
      },
      'ios'
    );
    const androidConfig = makeReactNativeConfig(
      webpackConfig,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
        assetsDest: path.resolve(__dirname, 'fixtures'),
      },
      'android'
    );

    expect(
      snapshotDiff(
        replacePathsInObject(iosConfig),
        replacePathsInObject(androidConfig)
      )
    ).toMatchSnapshot('diff ios/android config');
  });

  it('merges existing config', () => {
    const webpackConfig = require('./fixtures/haul.config.custom.js');
    const config = makeReactNativeConfig(
      webpackConfig,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
        assetsDest: path.resolve(__dirname, 'fixtures'),
      },
      'ios'
    );

    expect(config.entry).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/hot\/patch\.js/),
        './index.js',
      ])
    );
  });

  it('generates production config', () => {
    const webpackConfig = require('./fixtures/haul.config.js');
    const devConfig = makeReactNativeConfig(
      webpackConfig,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
        assetsDest: path.resolve(__dirname, 'fixtures'),
      },
      'ios'
    );
    const prodConfig = makeReactNativeConfig(
      webpackConfig,
      {
        dev: false,
        root: path.resolve(__dirname, 'fixtures'),
        assetsDest: path.resolve(__dirname, 'fixtures'),
      },
      'ios'
    );
    expect(
      snapshotDiff(
        replacePathsInObject(devConfig),
        replacePathsInObject(prodConfig)
      )
    ).toMatchSnapshot('diff dev/prod config');
  });
});

describe('injects polyfill into different entries', () => {
  test('entry is a string', () => {
    const userEntry = './src/index.js';
    const generatedEntry = injectPolyfillIntoEntry({
      entry: userEntry,
      root: path.join(__dirname, './fixtures'),
    });

    if (!Array.isArray(generatedEntry)) {
      throw new Error('Entries should be an array');
    }

    generatedEntry.forEach(entry => {
      expect(typeof entry).toBe('string');
    });
  });

  test('entry is an array', () => {
    const userEntry = ['./src/index.js', './src/module.js'];
    const generatedEntry = injectPolyfillIntoEntry({
      entry: userEntry,
      root: path.join(__dirname, './fixtures'),
    });

    if (!Array.isArray(generatedEntry)) {
      throw new Error('Entries should be an array');
    }

    generatedEntry.forEach(entry => {
      expect(typeof entry).toBe('string');
    });
  });

  test('entry is an object', () => {
    const userEntry = {
      entry1: './src/index.js',
      entry2: ['./src/module.js', './src/vendor.js'],
    };

    const generatedEntry = injectPolyfillIntoEntry({
      entry: userEntry,
      root: path.join(__dirname, './fixtures'),
    });

    Object.entries(generatedEntry).forEach(([key, value]) => {
      expect(Object.keys(userEntry).includes(key)).toBeTruthy();

      expect(Array.isArray(value)).toBeTruthy();
    });
  });
});
