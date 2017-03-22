/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const program = require('commander');
const pjson = require('../../package.json');

/**
 * We use `react-native` dependencies in some places (namely server),
 * until we get rid of them, this has to stay 
 */
require('react-native/packager/babelRegisterOnly')([
  /react-native\/local-cli/,
]);

program
  .command('start')
  .description('Starts a new webpack server')
  .action(require('./start'));

program
  .version(pjson.version)
  .parse(process.argv);