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
    const list = fs
      .readdirSync(cwd)
      .filter(f => /\.js$/.test(f) && f !== 'webpack.haul.js');

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
    const gitEntries = ['haul-debug.log', '.happypack'];
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

const sleep = (time: number = 1000) =>
  new Promise(resolve => setTimeout(resolve, time));

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
        message: messages.enterXcodeProjectFileName(),
        validate: pathToFile =>
          fs.existsSync(pathToFile) && pathToFile.includes('.xcodeproj')
            ? true
            : messages.xcodeProjectNotFound(pathToFile),
      },
    ]);

    entry = path.join(cwd, result.entry);
  }

  const progress = ora(messages.addingToBuildPipeline());

  await sleep();

  let project = fs.readFileSync(path.join(entry, 'project.pbxproj')).toString();

  // If xcode-project already contains our uuid
  if (project.includes('AD0CE2C91E925489006FC317')) {
    progress.info(messages.alreadyAddedToBuildPipeline());
    return;
  }

  // Define Haul build phase
  project = project.replace(
    '/* Begin PBXShellScriptBuildPhase section */',
    dedent`
      /* Begin PBXShellScriptBuildPhase section */
      AD0CE2C91E925489006FC317 /* Integrate Haul with React Native */ = {
        isa = PBXShellScriptBuildPhase;
        buildActionMask = 2147483647;
        files = (
        );
        inputPaths = (
        );
        outputPaths = (
        );
        runOnlyForDeploymentPostprocessing = 0;
        shellPath = /bin/sh;
        shellScript = "bash ../node_modules/haul/vendor/packager/haul-integrate.sh";
      };`,
  );

  // Add run script to phases that already contain `react-native-xcode.sh`
  project = project.replace(/buildPhases = \(\n(?:.*,\n)*\s*\);/g, match => {
    if (!match.includes('React Native')) return match;
    return match.replace(
      'buildPhases = (',
      dedent`
        buildPhases = (
          AD0CE2C91E925489006FC317 /* Integrate Haul with React Native */,
        `,
    );
  });

  fs.writeFileSync(path.join(entry, 'project.pbxproj'), project);

  progress.succeed(messages.addedToBuildPipeline());
};

module.exports = {
  name: 'init',
  description: 'Generates necessary configuration files',
  action: init,
};
