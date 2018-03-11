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
const barOptions = {
  complete: chalk.bold('='),
  incomplete: ' ',
  width: 20,
  total: 100,
};
const labelOptions = {
  android: {
    color: 'green',
    label: 'Android',
  },
  ios: {
    color: 'cyan',
    label: 'iOS',
  },
};

/*
 * Create label based on passed platform
 * We use `labelOptions` to customize know platforms
 * If platform is not know, returns default styles
 */
function createLabel(platform: string) {
  if (labelOptions[platform]) {
    const { color, label } = labelOptions[platform];
    return `${chalk.bold[color](label)}`.padEnd(30);
  }
  return `${chalk.bold.magenta(platform)}`.padEnd(30);
}

/*
 * Create progress bar itself
 */
function createBarFormat(platform: string) {
  const label = createLabel(platform);

  const leftBar = chalk.bold('[');
  const rightBar = chalk.bold(']');
  const percent = chalk.bold.blue(':percent');

  return `${label}${leftBar}:bar${rightBar} ${percent}`;
}

module.exports = function updateProgressBar(platform: string, percent: number) {
  if (!progressBar[platform]) {
    progressBar[platform] = progressBarFactory.newBar(
      createBarFormat(platform),
      barOptions
    );
  }

  progressBar[platform].update(percent);
};
