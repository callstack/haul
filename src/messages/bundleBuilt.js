/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { WebpackStats } from '../types';

const chalk = require('chalk');
const dedent = require('dedent');
const path = require('path');

module.exports = ({
  stats,
  platform,
  assetsPath,
  bundlePath,
}: {
  stats: WebpackStats,
  platform: string,
  assetsPath?: string,
  bundlePath?: string,
}) => {
  const heading = stats.hasWarnings()
    ? chalk.yellow('Built with warnings')
    : 'Built successfully!';

  if (assetsPath && bundlePath) {
    return dedent`
      ${heading}

      Assets location: ${chalk.grey(assetsPath)}
      Bundle location: ${chalk.grey(path.join(assetsPath, bundlePath))}      
    `;
  }

  const device = platform === 'all' ? 'your device' : `your ${platform} device`;

  return dedent`
    ${heading}

    You can now run the app on ${device}\n
  `;
};
