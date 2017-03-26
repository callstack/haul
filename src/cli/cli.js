/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const program = require('commander');
const pjson = require('../../package.json');
const logger = require('../logger');
const messages = require('../messages');

const commands: Array<Command> = [require('./start')];
const RNCommands: Array<string> = [
  'run-ios',
  'run-android',
  'library',
  'bundle',
  'unbundle',
  'link',
  'unlink',
  'install',
  'uninstall',
  'upgrade',
  'log-android',
  'log-ios',
  'dependencies',
];

commands.forEach((command: Command) => {
  const options = command.options || [];

  const cmd = program
    .command(command.name)
    .description(command.description)
    .action(function run(...args) {
      const opts = this.opts();
      const argv: Array<string> = args.slice(0, -1);

      try {
        logger.clear();
        command.action(argv, opts);
      } catch (error) {
        logger.error(error);
        process.exit(1);
      }
    });

  options.forEach(opt =>
    cmd.option(
      opt.name,
      opt.description,
      opt.parse || (val => val),
      typeof opt.default === 'function' ? opt.default() : opt.default,
    ));

  cmd._helpInformation = cmd.helpInformation.bind(cmd);
  cmd.helpInformation = function printHelp() {
    logger.clear();
    logger.printLogo(2);
    return this._helpInformation();
  };
});

program.command('*', null, { noHelp: true }).action(cmd => {
  logger.clear();
  logger.printLogo();

  if (RNCommands.includes(cmd)) {
    logger.warn(messages.notImplementedCommand(cmd));
  } else {
    logger.error(`:x:  Command '${cmd}' not recognized`);
  }

  program.help();
});

program.version(pjson.version).parse(process.argv);
