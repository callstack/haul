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
    output,
  }: { stats: WebpackStats, platform: string, output?: string },
) => {
  const heading = stats.hasWarnings()
    ? chalk.yellow('Compiled with warnings')
    : 'Compiled successfully!';

  if (output) {
    return dedent`
      ${heading}

      Bundle location:

        ${chalk.grey(output)}
    `;
  }

  const device = platform === 'all' ? 'your device' : `your ${platform} device`;

  return dedent`
    ${heading}

    You can now run the app on ${device}\n
  `;
};
