/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * bundleCompiled.js
 *
 * @flow
 */
const chalk = require('chalk');
const dedent = require('dedent');

import type { WebpackStats } from '../types';

module.exports = (
  {
    stats,
    showInfo,
    platform
  }: { stats: WebpackStats, showInfo: boolean, platform: string }
) => {
  if (stats.hasErrors()) {
    return chalk.red('Failed to compile');
  }

  if (stats.hasWarnings()) {
    return chalk.yellow('Compiled with warnings');
  }

  if (showInfo) {
    return dedent`
      ${chalk.green('Compiled successfully!')}

      You can now go to your ${platform} device to run the app.
    `;
  }

  return chalk.green('Compiled successfully!');
};
