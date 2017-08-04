/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import config from './fixtures/webpack.config.js';
import AssetResolver from '../AssetResolver';

const filesFromEntry = [
  require.resolve('./fixtures/file.pdf'),
  require.resolve('./fixtures/file@1x.jpeg'),
  require.resolve('./fixtures/file@3x.png'),
  require.resolve('./fixtures/file@2x.gif'),
];

test('Resolves to file@{number}x.{ext} if file.{ext} not present', done => {
  webpack(config, (err, stats) => {
    if (err) {
      done.fail(err);
    } else if (stats.hasErrors()) {
      done.fail(stats.toString());
    }

    const assetPaths = stats.toJson().modules.map(module => module.identifier);

    try {
      expect(assetPaths).toEqual(expect.arrayContaining(filesFromEntry));
      done();
    } catch (error) {
      done.fail(error);
    }
  });
});

test('AssetResolver.collect returns empty object for empty list', () => {
  const result = AssetResolver.collect([], {
    name: 'filename',
    type: 'jpeg',
    platform: 'native',
  });

  expect(result).toEqual({});
});

test('AssetResolver.collect returns empty object when file not in the list', () => {
  const result = AssetResolver.collect(['file.jpeg', 'filename.png'], {
    name: 'filename',
    type: 'jpeg',
    platform: 'android',
  });

  expect(result).toEqual({});
});

test('AssetResolver.collect returns a map of paths to resolve', () => {
  const files = fs.readdirSync(path.resolve(__dirname, './fixtures'));
  const result = AssetResolver.collect(files, {
    name: 'filename',
    type: 'jpeg',
    platform: 'ios',
  });

  expect(result).toMatchSnapshot();
});
