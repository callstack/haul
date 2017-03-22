/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const program = require('commander');
const pjson = require('../../package.json');

program
  .command('start')
  .description('Starts a new webpack server')
  .action(require('./start'));

program
  .version(pjson.version)
  .parse(process.argv);