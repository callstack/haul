import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { run, cleanup, yarnCommand } from '../../utils/common';
import { runHaul } from '../../utils/runHaul';

const TEST_PROJECT_DIR = path.resolve(__dirname, '__fixtures__/testapp');

const CONFIG_FILE_PATH = path.resolve(TEST_PROJECT_DIR, 'haul.config.js');
const BABEL_CONFIG_FILE_PATH = path.resolve(
  TEST_PROJECT_DIR,
  'babel.config.js'
);
const XCODE_PROJECT_PATH = path.resolve(
  TEST_PROJECT_DIR,
  'ios/testapp.xcodeproj/project.pbxproj'
);
const GRADLE_PATH = path.resolve(TEST_PROJECT_DIR, 'android/app/build.gradle');
const ENTER_KEY = '\x0d';

beforeEach(() => {
  cleanup(path.join(TEST_PROJECT_DIR, '..'));
  mkdirp.sync(path.join(TEST_PROJECT_DIR, '..'));
});
afterEach(() => cleanup(path.join(TEST_PROJECT_DIR, '..')));

test('init command on a fresh react-native 0.61 project', done => {
  run(`${yarnCommand} init -y`, path.join(TEST_PROJECT_DIR, '..'));
  run(`${yarnCommand} add react-native-cli`, path.join(TEST_PROJECT_DIR, '..'));
  run(
    `${yarnCommand} react-native init testapp --version 0.61.0`,
    path.join(TEST_PROJECT_DIR, '..')
  );

  const haul = runHaul(TEST_PROJECT_DIR, ['init']);

  haul.stdout.on('data', () => {
    haul.stdin.write(ENTER_KEY);
  });

  haul.stdout.on('close', () => {
    try {
      const haulConfig = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const xcodeProject = fs.readFileSync(XCODE_PROJECT_PATH, 'utf8');
      const gradleBuild = fs.readFileSync(GRADLE_PATH, 'utf8');
      const babelConfig = fs.readFileSync(BABEL_CONFIG_FILE_PATH, 'utf8');
      expect(haulConfig).toMatch(/@haul-bundler\/preset-0\.60/);
      expect(xcodeProject.match(/added by Haul/g)!.length).toBe(2);
      expect(gradleBuild.match(/\nproject\.ext\.react/g)!.length).toBe(1);
      expect(gradleBuild).toMatch('entryFile: "index.js",');
      expect(gradleBuild).toMatch(
        'cliPath: "node_modules/@haul-bundler/cli/bin/haul.js"'
      );
      expect(babelConfig).toMatch('@haul-bundler/babel-preset-react-native');
      done();
    } catch (error) {
      done.fail(error);
    }
  });
});
