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
const clear = require('clear');
const messages = require('../messages');
const { MessageError } = require('../errors');

const commands: Array<Command> = [require('./start'), require('./bundle')];

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
    .allowUnknownOption(command.allowUnknownOptions)
    .description(command.description)
    .action(async function run(...args) {
      const opts = this.opts();
      const argv: Array<string> = args.slice(0, -1);

      try {
        clear();
        await command.action(argv, opts);
      } catch (error) {
        clear();
        if (error instanceof MessageError) {
          logger.error(error.message);
        } else {
          logger.error(
            messages.commandFailed({
              command: `haul ${command.name}`,
              error,
              stack: error.stack,
            }),
          );
        }
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

  const defaultHelpPrinter = cmd.helpInformation.bind(cmd);
  cmd.helpInformation = () => {
    logger.clear();
    return defaultHelpPrinter();
  };
});

program.command('*', null, { noHelp: true }).action(cmd => {
  logger.clear();

  if (RNCommands.includes(cmd)) {
    logger.error(messages.commandNotImplemented(cmd));
    return;
  }

  logger.error(messages.commandNotFound(cmd));
});

program.version(pjson.version).parse(process.argv);
