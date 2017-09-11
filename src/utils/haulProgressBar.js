/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * haulProgressBar.js
 *
 * @flow
 */

const multiProgress = require('multi-progress');
const chalk = require('chalk');

const progressBarFactory = new multiProgress(process.stderr);

const progressBar = {};
const lastPercent = {};
const barOptions = {
  complete: chalk.bold('='),
  incomplete: ' ',
  width: 20,
  total: 100,
};

function createBarFormat(plat: string) {
  const platform =
    plat === 'android'
      ? `${chalk.bold.green('Android')}:`.padEnd(30)
      : `${chalk.bold.cyan('iOS')}:`.padEnd(30);

  const leftBar = chalk.bold('[');
  const rightBar = chalk.bold(']');
  const percent = chalk.bold.blue(':percent');

  return `${platform}${leftBar}:bar${rightBar} ${percent}`;
}

module.exports = function createProgressBar(newPlatform: string) {
  if (!progressBar[newPlatform]) {
    progressBar[newPlatform] = progressBarFactory.newBar(
      createBarFormat(newPlatform),
      barOptions,
    );
    lastPercent[newPlatform] = 0;
  }

  return function haulProgressBar(platform: string, percent: number) {
    const newPercent = Math.ceil(percent * barOptions.width);
    if (newPercent !== lastPercent[platform]) {
      progressBar[platform].update(percent);
      lastPercent[platform] = newPercent;
    }
  };
};
