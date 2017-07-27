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
const chalk = require('chalk');
const inquirer = require('inquirer');
const isReactNativeProject = require('../utils/isReactNativeProject');

const messages = require('../messages');

async function init() {
  let progress = ora(messages.checkingProject()).start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const cwd = process.cwd();

  // Are we inside a React Native project?
  if (isReactNativeProject(cwd)) {
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
  await addToPackageScripts(cwd);

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

const getRunScript = (scriptName: string) => {
  const runCommand = scriptName === 'start' ? 'yarn' : 'yarn run';
  return `${runCommand} ${scriptName}`;
};

/**
 * Adds Haul to package.json scripts
 */
const addToPackageScripts = async (cwd: string) => {
  const pjson = JSON.parse(
    fs.readFileSync(path.join(cwd, 'package.json')).toString(),
  );

  const scripts = pjson.scripts || {};

  const haulScript = Object.keys(scripts).find(
    name => scripts[name] === 'haul start',
  );

  if (haulScript) {
    ora().info(
      `Haul already exists in your package.json. Start Haul by running ${getRunScript(
        haulScript,
      )}'`,
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
    [scriptName]: 'haul start',
  });

  const progress = ora(
    `Adding \`${scriptName}\` script to your package.json`,
  ).start();

  await sleep();

  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(pjson, null, 2),
  );

  progress.succeed(
    `You can now start Haul by running '${getRunScript(scriptName)}'`,
  );
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

    entry = path.resolve(cwd, result.entry);
  }

  const progress = ora('Adding haul to your Xcode build scripts');

  await sleep();

  let project = fs.readFileSync(path.join(entry, 'project.pbxproj')).toString();

  const haulScriptKey = 'AD0CE2C91E925489006FC317';

  // Are we already integrated?
  if (project.includes(haulScriptKey)) {
    progress.info('Haul is already part of your build scripts');
    return;
  }

  /**
   * Define Haul integration script in the PBXShellScriptBuildPhase section.
   *
   * This is done by prepending our predefined script phase to the list
   * of all phases.
   */
  project = project.replace(
    '/* Begin PBXShellScriptBuildPhase section */',
    dedent`
      /* Begin PBXShellScriptBuildPhase section */
      ${haulScriptKey} /* Integrate Haul with React Native */ = {
        isa = PBXShellScriptBuildPhase;
        buildActionMask = 2147483647;
        name = "Integrate Haul with React Native";
        files = (
        );
        inputPaths = (
        );
        outputPaths = (
        );
        runOnlyForDeploymentPostprocessing = 0;
        shellPath = /bin/sh;
        shellScript = "bash ../node_modules/haul/src/utils/haul-integrate.sh";
      };`,
  );

  /**
   * Add Haul integration to build phases that already contain `react-native-xcode.sh`
   *
   * We are typically trying to match the following:
   *
   * ```
   *   buildPhases = (
   *     13B07F871A680F5B00A75B9A \/* Sources *\/,
   *     13B07F8C1A680F5B00A75B9A \/* Frameworks *\/,
   *     13B07F8E1A680F5B00A75B9A \/* Resources *\/,
   *     00DD1BFF1BD5951E006B06BC \/* Bundle React Native code and images *\/,
   *   );
   * ```
   *
   * and prepend our build phase to the beginning.
   */
  let sectionsCount = 0;
  project = project.replace(/buildPhases = \(\n(?:.*,\n)*\s*\);/g, match => {
    if (!match.includes('React Native')) return match;
    sectionsCount++;
    return match.replace(
      'buildPhases = (',
      dedent`
        buildPhases = (
          ${haulScriptKey} /* Integrate Haul with React Native */,
        `,
    );
  });

  if (sectionsCount > 0) {
    fs.writeFileSync(path.join(entry, 'project.pbxproj'), project);
    progress.succeed('Added haul to your Xcode build scripts');
  } else {
    progress.fail(
      `Failed to add Haul to your Xcode build scripts. See: ${chalk.grey(
        'https://github.com/callstack-io/haul/blob/master/docs/Configuring%20Your%20Project.md#integrating-with-xcode',
      )} for manual instructions`,
    );
  }
};

module.exports = {
  name: 'init',
  description: 'Generates necessary configuration files',
  action: init,
};
