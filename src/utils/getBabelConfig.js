/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { EnvOptions } from '../types';

const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const DEFAULT_BABELRC = {
  presets: [
    [
      require.resolve('metro-react-native-babel-preset'),
      { disableImportExportTransform: true },
    ],
  ],
};

module.exports = function getBabelConfig(cwd: string, options: EnvOptions) {
  let babelrc;

  const file = path.join(cwd, '.babelrc');

  if (fs.existsSync(file)) {
    logger.info(`loaded babel-loader configuration: ${file}`);
    babelrc = { extends: file };
  } else {
    babelrc = DEFAULT_BABELRC;
  }

  return Object.assign({}, babelrc, {
    plugins: [require.resolve('./fixRequireIssues')]
      .concat(
        process.env.NODE_ENV === 'production' || options.disableHotReloading
          ? []
          : [
              require.resolve('react-hot-loader/babel'),
              require.resolve('../hot/babelPlugin'),
            ]
      )
      .concat(babelrc.plugins || []),
  });
};
