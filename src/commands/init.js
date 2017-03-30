/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const fs = require('fs');
const dedent = require('dedent');
const ora = require('ora');
const inquirer = require('inquirer');

const messages = require('../messages');

async function init() {
  let progress = ora(messages.checkingProject()).start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const cwd = process.cwd();

  // Are we inside a React Native project?
  let valid = false;

  try {
    const pak = JSON.parse(
      fs.readFileSync(path.join(cwd, 'package.json')).toString(),
    );

    if (pak.dependencies['react-native']) {
      valid = true;
    }
  } catch (e) {
    // Ignore
  }

  if (valid) {
    progress.succeed(messages.verifiedProject());
  } else {
    progress.fail(messages.invalidProject());
    process.exit(1);
  }

  // Does `webpack.haul.js` already exist?
  if (fs.existsSync(path.join(cwd, 'webpack.haul.js'))) {
    const result = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: messages.overwriteConfig(),
      },
    ]);

    if (!result.overwrite) {
      return;
    }
  }

  let entry;

  // Do `index.ios.js` or `index.android.js` exist?
  if (
    fs.existsSync(path.join(cwd, 'index.ios.js')) ||
    fs.existsSync(path.join(cwd, 'index.android.js'))
  ) {
    entry = 'index.${platform}.js'; // eslint-disable-line no-template-curly-in-string
  } else if (fs.existsSync(path.join(cwd, 'index.js'))) {
    entry = 'index.js';
  } else {
    const list = fs.readdirSync(cwd).filter(f => /\.js$/.test(f) && f !== 'webpack.haul.js');

    if (list.length <= 5) {
      const result = await inquirer.prompt([
        {
          type: 'list',
          name: 'entry',
          message: messages.selectEntryFile(),
          choices: list,
        },
      ]);

      entry = result.entry;
    } else {
      const result = await inquirer.prompt([
        {
          type: 'input',
          name: 'entry',
          message: messages.enterEntryFileName(),
        },
      ]);

      entry = result.entry;
    }
  }

  progress = ora(messages.generatingConfig()).start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const config = dedent`
    module.exports = ({ platform }) => ({
      entry: \`./${entry}\`,
    });
  `;

  fs.writeFileSync(path.join(cwd, 'webpack.haul.js'), config);

  progress.succeed(messages.generatedConfig());
}

module.exports = {
  name: 'init',
  description: 'Generates necessary configuration files',
  action: init,
};
