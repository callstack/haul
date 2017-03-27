/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { WebpackStats } from '../types';

const chalk = require('chalk');
const dedent = require('dedent');

module.exports = (
  {
    stats,
    platform,
  }: { stats: WebpackStats, platform: string },
) => {
  if (stats.hasWarnings()) {
    return chalk.yellow('Compiled with warnings');
  }

  const device = platform === 'all' ? 'your device' : `your ${platform} device`;

  return dedent`
    Compiled successfully!

    You can now run the app on ${device}\n
  `;
};
