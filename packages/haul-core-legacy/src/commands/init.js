/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const path = require('path');
const fs = require('fs');
const dedent = require('dedent');
const ora = require('ora');
const inquirer = require('inquirer');
const semver = require('semver');
const getReactNativeVersion = require('../utils/getReactNativeVersion');

const constants = require('../constants');
const messages = require('../messages');

async function init() {
  let progress = ora(messages.checkingProject()).start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const cwd = process.cwd();

  // Are we inside a React Native project?
  if (getReactNativeVersion(cwd)) {
    progress.succeed(messages.verifiedProject());
  } else {
    progress.fail(messages.invalidProject());
    process.exit(1);
  }

  // Does `haul.config.js` already exist?
  if (fs.existsSync(path.join(cwd, constants.DEFAULT_CONFIG_FILENAME))) {
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
    const list = fs
      .readdirSync(cwd)
      .filter(f => /\.js$/.test(f) && f !== constants.DEFAULT_CONFIG_FILENAME);

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

  progress = ora();

  const pathToGitIgnore = path.join(cwd, '.gitignore');

  if (fs.existsSync(pathToGitIgnore)) {
    progress = ora(messages.gitAddingEntries()).start();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const gitignore = fs.readFileSync(pathToGitIgnore);
    const gitEntries = ['haul-debug.log'];
    const haulIgnoreHeader = '\n# Haul\n#\n';
    let haulIgnore = haulIgnoreHeader;

    for (const gitEntry of gitEntries) {
      if (!gitignore.includes(gitEntry)) {
        haulIgnore += `${gitEntry}\n`;
      }
    }

    if (haulIgnore !== haulIgnoreHeader) {
      fs.appendFileSync(pathToGitIgnore, haulIgnore);
      progress.succeed(messages.gitAddedEntries());
    } else {
      progress.info(messages.gitAlreadyAdded());
    }
  } else {
    progress.warn(messages.gitNotFound());
  }

  await addToXcodeBuild(cwd);

  const rnVersion = getReactNativeVersion(cwd);

  if (semver.gte(rnVersion, '0.43.0')) {
    await addToGradleBuild(cwd);
  }

  await addToPackageScripts(cwd);

  progress = ora(messages.generatingConfig()).start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const version = semver.parse(rnVersion);
  const config = dedent`
    import { createWebpackConfig } from "@haul/preset-${version.major}.${
    version.minor
  }";

    export default {
      webpack: createWebpackConfig(({ platform }) => ({
        entry: \`./${entry}\`
      })),
      ramBundle: {
        minification: {}
      }
    };
  `;

  fs.writeFileSync(path.join(cwd, constants.DEFAULT_CONFIG_FILENAME), config);

  progress.succeed(messages.generatedConfig());
}

const sleep = (time: number = 1000) =>
  new Promise(resolve => setTimeout(resolve, time));

const getRunScript = (scriptName: string) => {
  const runCommand = scriptName === 'start' ? 'yarn' : 'yarn run';
  return `${runCommand} ${scriptName}`;
};

/**
 * Adds Haul to package.json scripts
 */
const addToPackageScripts = async (cwd: string) => {
  const pjson = JSON.parse(
    fs.readFileSync(path.join(cwd, 'package.json')).toString()
  );

  const scripts = pjson.scripts || {};

  const haulScript = Object.keys(scripts).find(
    name => scripts[name] === 'haul'
  );

  if (haulScript) {
    ora().info(
      `Haul already exists in your package.json. Start Haul by running ${getRunScript(
        haulScript
      )}'`
    );
    return;
  }

  let scriptName = 'start';

  if (
    scripts.start &&
    scripts.start !== 'node ./node_modules/react-native/local-cli/cli.js start'
  ) {
    const result = await inquirer.prompt([
      {
        type: 'input',
        name: 'scriptName',
        message:
          'Enter the name of the script to add to package.json, e.g. `haul` for `yarn run haul`',
        default: 'haul',
      },
    ]);

    scriptName = result.scriptName;
  }

  pjson.scripts = Object.assign({}, scripts, {
    [scriptName]: 'haul',
  });

  const progress = ora(
    `Adding \`${scriptName}\` script to your package.json`
  ).start();

  await sleep();

  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(pjson, null, 2)
  );

  progress.succeed(
    `You can now start Haul by running '${getRunScript(scriptName)}'`
  );
};

const addToGradleBuild = async (cwd: string) => {
  let entry;

  // Does `android/app/build.gradle` exist?
  const androidPath = path.join(cwd, 'android/app');
  if (fs.existsSync(androidPath)) {
    const list = fs
      .readdirSync(androidPath)
      .filter(file => file.includes('build.gradle'));

    // Do nothing if multiple projects were found
    if (list.length === 1) {
      entry = path.join(androidPath, list[0]);
    }
  }

  // Otherwise, ask for path to a file
  if (!entry) {
    const result = await inquirer.prompt([
      {
        type: 'input',
        name: 'entry',
        message: 'Enter path to the android/app/build.gradle file',
        validate: pathToFile =>
          fs.existsSync(pathToFile) && pathToFile.includes('build.gradle')
            ? true
            : `${pathToFile} is not a valid build.gradle`,
      },
    ]);

    entry = path.resolve(result.entry);
  }

  const progress = ora('Adding haul to your build.gradle');

  await sleep();

  let project = fs.readFileSync(entry).toString();

  const cliString = '"node_modules/@haul/cli/bin/haul.js"';

  const gradleConf = `
    project.ext.react = [
      cliPath: ${cliString}
    ]
  `;

  // Are we already integrated?
  if (project.includes(cliString)) {
    progress.info('Haul is already part of your build.gradle');
    return;
  }

  project = project.replace(
    /^apply from: "..\/..\/node_modules\/react-native\/react.gradle"/gm,
    dedent`
    ${gradleConf}
    apply from: "../../node_modules/react-native/react.gradle"
    `
  );

  fs.writeFileSync(entry, project);
  progress.succeed('Added haul to your build.gradle');
};

/**
 * Adds Haul to native iOS build pipeline
 */
const addToXcodeBuild = async (cwd: string) => {
  let entry;

  // Does `ios/*.xcodeproj` exist?
  const iosPath = path.join(cwd, 'ios');
  if (fs.existsSync(iosPath)) {
    const list = fs
      .readdirSync(path.join(cwd, 'ios'))
      .filter(file => file.includes('.xcodeproj'));

    // Do nothing if multiple projects were found
    if (list.length === 1) {
      entry = path.join(iosPath, list[0]);
    }
  }

  // Otherwise, ask for path to a file
  if (!entry) {
    const result = await inquirer.prompt([
      {
        type: 'input',
        name: 'entry',
        message: 'Enter path to the .xcodeproj file',
        validate: pathToFile =>
          fs.existsSync(pathToFile) && pathToFile.includes('.xcodeproj')
            ? true
            : `${pathToFile} is not a valid .xcodeproj`,
      },
    ]);

    entry = path.resolve(result.entry);
  }

  const progress = ora('Adding haul to your Xcode build scripts');

  await sleep();

  let project = fs.readFileSync(path.join(entry, 'project.pbxproj')).toString();

  const haulSignature = 'added by Haul';

  /* Make sure we check both project iOS and iOS-TV, that's the magic behind "2" constant */

  const PROJECTS_COUNT = 2;

  const countOccurrences = search => {
    return project.split(search).length - 1;
  };

  // Are we already integrated?
  if (countOccurrences(haulSignature) === PROJECTS_COUNT) {
    progress.info('Haul is already part of your build scripts');
    return;
  }

  const originalTask = 'shellScript = "export NODE_BINARY=node';

  if (countOccurrences(originalTask) !== PROJECTS_COUNT) {
    progress.warn(
      `Couldn't edit Xcode project. Haven't recognized 'Bundle React Native code and images' build phase.`
    );
    return;
  }

  const haulTask = `shellScript = "# ${haulSignature}\nexport CLI_PATH=node_modules/@haul/cli/bin/haul.js\nexport NODE_BINARY=node`;

  project = project.replace(new RegExp(originalTask, 'g'), haulTask);

  fs.writeFileSync(path.join(entry, 'project.pbxproj'), project);
  progress.succeed('Added haul to your Xcode build scripts');
};

module.exports = ({
  name: 'init',
  description: 'Generates necessary configuration files',
  action: init,
}: Command);
