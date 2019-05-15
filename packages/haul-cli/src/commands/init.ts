import {
  Runtime,
  getReactNativeVersion,
  DEFAULT_CONFIG_FILENAME,
} from '@haul-bundler/core';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import semver from 'semver';
import dedent from 'dedent';

const delay = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

async function checkProject(cwd: string, runtime: Runtime) {
  const progress = ora('Checking project files').start();
  await delay(1000);

  // Are we inside a React Native project?
  if (getReactNativeVersion(cwd)) {
    progress.succeed('Project looks good');
  } else {
    progress.fail(dedent`
    This doesn't seem to be a React Native project.

    Make sure you have a ${runtime.logger.enhanceWithModifier(
      'bold',
      'package.json'
    )} file with ${runtime.logger.enhanceWithModifier(
      'bold',
      'react-native'
    )} in dependencies, and you have installed these dependencies.

    To generate a React Native project, run ${runtime.logger.enhanceWithModifier(
      'bold',
      'react-native init <ProjectName>'
    )}. See ${runtime.logger.enhanceWithColor(
      'cyan',
      'https://facebook.github.io/react-native/docs/getting-started.html'
    )} for details.
  `);
    runtime.complete(1);
  }
}

async function modifyBabelConfig(cwd: string, runtime: Runtime) {
  const progress = ora('Updating Babel config').start();

  const defaultBabelConfigPaths = [
    path.join(cwd, 'babel.config.js'),
    path.join(cwd, '.babelrc.js'),
    path.join(cwd, '.babelrc'),
  ];

  let babelConfigPath = defaultBabelConfigPaths.find(filePath =>
    fs.existsSync(filePath)
  );

  if (!babelConfigPath) {
    const result = (await inquirer.prompt([
      {
        type: 'input',
        name: 'entry',
        message: 'Enter path to the Babel config file',
        validate: (pathToFile: string) =>
          fs.existsSync(pathToFile) ? true : `${pathToFile} is not a valid`,
      },
    ])) as { entry: string };

    babelConfigPath = path.resolve(result.entry);
  }

  const babelConfig = fs.readFileSync(babelConfigPath).toString();
  fs.writeFileSync(
    babelConfigPath,
    babelConfig.replace(
      'metro-react-native-babel-preset',
      '@haul-bundler/babel-preset-react-native'
    )
  );

  progress.succeed(
    `Updated Babel config at ${runtime.logger.enhanceWithModifier(
      'bold',
      path.relative(cwd, babelConfigPath)
    )}`
  );
}

async function modifyXcodeProject(cwd: string) {
  let xcodeProject;

  // Does `ios/*.xcodeproj` exist?
  const iosPath = path.join(cwd, 'ios');
  if (fs.existsSync(iosPath)) {
    const list = fs
      .readdirSync(path.join(cwd, 'ios'))
      .filter(file => file.includes('.xcodeproj'));

    // Do nothing if multiple projects were found
    if (list.length === 1) {
      xcodeProject = path.join(iosPath, list[0]);
    }
  }

  // Otherwise, ask for path to a file
  if (!xcodeProject) {
    const result = (await inquirer.prompt([
      {
        type: 'input',
        name: 'entry',
        message: 'Enter path to the .xcodeproj file',
        validate: (pathToFile: string) =>
          fs.existsSync(pathToFile) && pathToFile.includes('.xcodeproj')
            ? true
            : `${pathToFile} is not a valid .xcodeproj`,
      },
    ])) as { entry: string };

    xcodeProject = path.resolve(result.entry);
  }

  const progress = ora('Adding haul to your Xcode build scripts');

  await delay(1000);

  let project = fs
    .readFileSync(path.join(xcodeProject, 'project.pbxproj'))
    .toString();

  const haulSignature = 'added by Haul';

  /* Make sure we check both project iOS and iOS-TV, that's the magic behind "2" constant */

  const PROJECTS_COUNT = 2;

  const countOccurrences = (search: string) => {
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

  const haulTask = `shellScript = "# ${haulSignature}\\nexport CLI_PATH=node_modules/@haul-bundler/cli/bin/haul.js\\nexport NODE_BINARY=node`;

  project = project.replace(new RegExp(originalTask, 'g'), haulTask);

  fs.writeFileSync(path.join(xcodeProject, 'project.pbxproj'), project);
  progress.succeed('Added haul to your Xcode build scripts');
}

async function modifyGradleBuild(cwd: string) {
  let gradleBuildFile;
  // Does `android/app/build.gradle` exist?
  const androidPath = path.join(cwd, 'android/app');
  if (fs.existsSync(androidPath)) {
    const list = fs
      .readdirSync(androidPath)
      .filter(file => file.includes('build.gradle'));
    // Do nothing if multiple projects were found
    if (list.length === 1) {
      gradleBuildFile = path.join(androidPath, list[0]);
    }
  }
  // Otherwise, ask for path to a file
  if (!gradleBuildFile) {
    const result = (await inquirer.prompt([
      {
        type: 'input',
        name: 'entry',
        message: 'Enter path to the android/app/build.gradle file',
        validate: (pathToFile: string) =>
          fs.existsSync(pathToFile) && pathToFile.includes('build.gradle')
            ? true
            : `${pathToFile} is not a valid build.gradle`,
      },
    ])) as { entry: string };
    gradleBuildFile = path.resolve(result.entry);
  }
  const progress = ora('Adding haul to your build.gradle');
  await delay(1000);
  let project = fs.readFileSync(gradleBuildFile).toString();
  const cliString = '"node_modules/@haul-bundler/cli/bin/haul.js"';

  // Are we already integrated?
  if (project.includes(cliString)) {
    progress.info('Haul is already part of your build.gradle');
    return;
  }
  project = project.replace(
    /project\.ext\.react = \[\n(.+)\n\]/,
    dedent`
    project.ext.react = [
    $1
        cliPath: ${cliString}
    ]
    `
  );
  fs.writeFileSync(gradleBuildFile, project);
  progress.succeed('Added haul to your build.gradle');
}

function getRunScript(scriptName: string) {
  const runCommand = scriptName === 'start' ? 'yarn' : 'yarn run';
  return `${runCommand} ${scriptName}`;
}

async function addHaulScript(cwd: string) {
  const packageJson = require(path.join(cwd, 'package.json'));
  const scripts = packageJson.scripts || {};
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
    scripts.start !== 'node node_modules/react-native/local-cli/cli.js start'
  ) {
    const result = (await inquirer.prompt([
      {
        type: 'input',
        name: 'scriptName',
        message:
          'Enter the name of the script to add to package.json, e.g. `haul` for `yarn run haul`',
        default: 'haul',
      },
    ])) as { scriptName: string };

    scriptName = result.scriptName;
  }

  packageJson.scripts = Object.assign({}, scripts, {
    [scriptName]: 'haul start',
  });

  const progress = ora(
    `Adding \`${scriptName}\` script to your package.json`
  ).start();

  await delay(1000);

  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  progress.succeed(
    `You can now start Haul by running '${getRunScript(scriptName)}'`
  );
}

async function createHaulProjectConfig(
  cwd: string,
  reactNativeVersion: string,
  runtime: Runtime
) {
  // Does `haul.config.js` already exist?
  if (fs.existsSync(path.join(cwd, DEFAULT_CONFIG_FILENAME))) {
    const result = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `There is already a '${DEFAULT_CONFIG_FILENAME}'. Overwrite it?`,
      },
    ])) as { overwrite: boolean };

    if (!result.overwrite) {
      runtime.complete(0);
    }
  }

  const progress = ora('Generating config files').start();

  await delay(1000);

  const version = semver.parse(reactNativeVersion);
  if (!version) {
    throw new Error(`Cannot parse React Native version: ${reactNativeVersion}`);
  }

  const config = dedent`
    import { createWebpackConfig } from "@haul-bundler/preset-${
      version.major
    }.${version.minor}";

    export default {
      webpack: createWebpackConfig(({ platform }) => ({
        entry: \`./index.js\`
      }))
    };
  `;

  fs.writeFileSync(path.join(cwd, DEFAULT_CONFIG_FILENAME), config);

  progress.succeed(
    `Generated ${runtime.logger.enhanceWithModifier(
      'bold',
      DEFAULT_CONFIG_FILENAME
    )}`
  );
}

export default function initCommand(runtime: Runtime) {
  return {
    command: 'init',
    describe: 'Generates necessary configuration files',
    async handler() {
      let exitCode = 0;
      try {
        const cwd = process.cwd();

        const rnVersion = getReactNativeVersion(cwd);

        if (!rnVersion) {
          runtime.logger.error(
            'Cannot find React Native. Are you in React Native project?'
          );
          runtime.complete(1);
        }

        await checkProject(cwd, runtime);
        await createHaulProjectConfig(cwd, rnVersion || '', runtime);
        await modifyBabelConfig(cwd, runtime);
        await modifyXcodeProject(cwd);
        await modifyGradleBuild(cwd);
        await addHaulScript(cwd);
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        exitCode = 1;
      } finally {
        runtime.complete(exitCode);
      }
    },
  };
}
