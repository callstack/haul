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

module.exports = (
  {
    stats,
    platform,
    outputs,
  }: {
    stats: WebpackStats,
    platform: string,
    outputs?: [{
      path: string,
      filename: string,
    }],
  },
) => {
  const heading = stats.hasWarnings()
    ? chalk.yellow('Built with warnings')
    : 'Built successfully!';

  if (outputs && outputs.length) {
    return dedent`
      ${heading}

      ${outputs
      .map(e => dedent`
        Assets location: ${chalk.grey(e.path)}
        Bundle location: ${chalk.grey(path.join(e.path, e.filename))}
      `)
      .join('\n\n')}
    `;
  }

  const device = platform === 'all' ? 'your device' : `your ${platform} device`;

  return dedent`
    ${heading}

    You can now run the app on ${device}\n
  `;
};
