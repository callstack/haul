/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const getEntryFiles = require('../getEntryFiles');
const path = require('path');
const dedent = require('dedent');

const fakePolyfill = 'polyfill/to/remove';
const fakeCwd = '/usr/fake';

const originalCWD = process.cwd;

beforeEach(() => {
  // $FlowFixMe
  process.cwd = () => fakeCwd;
});

beforeAll(() => {
  // $FlowFixMe
  process.cwd = originalCWD;
});

describe('getEntryFiles handles', () => {
  test('entry as a string', () => {
    const entry = '/path/to/entry.js';
    const result = getEntryFiles(entry);
    expect(result).toBe(path.join(fakeCwd, entry));
  });
  test('entry as an array', () => {
    // polyfill is being removed from entries
    const entry = [fakePolyfill, 'entry/one.js', 'entry/two.js'];
    const result = getEntryFiles(entry);

    expect(result).toBe(
      `${path.join(fakeCwd, entry[1])}\n${path.join(fakeCwd, entry[2])}`
    );
  });
  test('entry as object', () => {
    const entry = {
      main: [fakePolyfill, 'index.js'],
      vendor: [fakePolyfill, 'vendor.js', 'stuff.js'],
    };
    const result = getEntryFiles(entry);

    expect(result).toBe(
      dedent(`(chunk: main)
        ${path.join(fakeCwd, entry.main[1])}
        (chunk: vendor)
        ${path.join(fakeCwd, entry.vendor[1])}
        ${path.join(fakeCwd, entry.vendor[2])}`)
    );
  });
});
