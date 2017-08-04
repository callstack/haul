/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import webpack from 'webpack';
import config from './fixtures/webpack.config.js';

test('Resolves to file@{number}x.{ext} if file.{ext} not present', done => {
  webpack(config, (err, stats) => {
    if (err) {
      done.fail(err);
    } else if (stats.hasErrors()) {
      done.fail(stats.toString());
    }

    const assetPaths = stats.toJson().modules.map(module => module.identifier);

    try {
      expect(assetPaths).toEqual(
        expect.arrayContaining([
          require.resolve('./fixtures/file.pdf'),
          require.resolve('./fixtures/file@1x.jpeg'),
          require.resolve('./fixtures/file@3x.png'),
          require.resolve('./fixtures/file@2x.gif'),
        ]),
      );
      done();
    } catch (error) {
      done.fail(error);
    }
  });
});
