/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import path from 'path';
import { injectPolyfillIntoEntry } from '../makeReactNativeConfig';

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
