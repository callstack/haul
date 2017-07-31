/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const chalk = require('chalk');
const dedent = require('dedent');

module.exports = () => dedent`
  This doesn't seem to be a React Native project.

  Make sure you have a ${chalk.bold('package.json')} file with ${chalk.bold(
  'react-native',
)} in dependencies.

  To generate a React Native project, run ${chalk.bold(
    'react-native init <ProjectName>',
  )}. See ${chalk.cyan(
  'https://facebook.github.io/react-native/docs/getting-started.html',
)} for details.
`;
