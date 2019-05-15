/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { run, yarnCommand } = require('../utils');
const { runHaul } = require('../runHaul');

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react_native_clean'
);
const CONFIG_FILE_PATH = path.resolve(TEST_PROJECT_DIR, 'haul.config.js');
const BABEL_CONFIG_FILE_PATH = path.resolve(
  TEST_PROJECT_DIR,
  'babel.config.js'
);
const XCODE_PROJECT_PATH = path.resolve(
  TEST_PROJECT_DIR,
  'ios/react_native_clean.xcodeproj/project.pbxproj'
);
const GRADLE_PATH = path.resolve(TEST_PROJECT_DIR, 'android/app/build.gradle');
const PACKAGE_PATH = path.resolve(TEST_PROJECT_DIR, 'package.json');
const ENTER_KEY = '\x0d';

const cleanProject = () => {
  run(`git checkout ${GRADLE_PATH}`);
  run(`git checkout ${XCODE_PROJECT_PATH}`);
  run(`git checkout ${BABEL_CONFIG_FILE_PATH}`);
  run(`git checkout ${PACKAGE_PATH}`);
  rimraf.sync(CONFIG_FILE_PATH);
};

beforeAll(() => run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR));
beforeEach(cleanProject);
afterEach(cleanProject);

test('init command on react-native project', done => {
  const haul = runHaul(TEST_PROJECT_DIR, ['init']);

  haul.stdout.on('data', () => {
    haul.stdin.write(ENTER_KEY);
  });

  haul.stdout.on('close', () => {
    try {
      const haulConfig = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const xcodeProject = fs.readFileSync(XCODE_PROJECT_PATH, 'utf8');
      const babelConfig = fs.readFileSync(BABEL_CONFIG_FILE_PATH, 'utf8');
      const packageJson = require(PACKAGE_PATH);
      expect(haulConfig).toMatchSnapshot();
      expect(xcodeProject.match(/added by Haul/g).length).toBe(2);
      expect(babelConfig).toMatch('@haul-bundler/babel-preset-react-native');
      expect(packageJson.scripts.start).toEqual('haul start');
      done();
    } catch (error) {
      done.fail(error);
    }
  });
});
