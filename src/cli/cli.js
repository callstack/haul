/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
import type { Command } from '../types';

const minimist = require('minimist');
const camelcaseKeys = require('camelcase-keys');

const pjson = require('../../package.json');
const logger = require('../logger');
const messages = require('../messages');
const { MessageError } = require('../errors');

const COMMANDS: Array<Command> = [require('./start'), require('./bundle')];

const NOT_SUPPORTED_COMMANDS = [
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

function validateOptions(options, flags, command) {
  return options.reduce(
    (acc, option) => {
      let value = flags[option.name] || option.default;

      if (option.required && !value) {
        throw new MessageError(
          messages.invalidOption({
            option,
            command,
          }),
        );
      }

      if (option.parse) {
        value = option.parse(value);
      }

      if (option.choices && !option.choices.find(c => c.value === value)) {
        throw new MessageError(
          messages.invalidOption({
            option,
            value,
            command,
          }),
        );
      }

      // eslint-disable-next-line no-param-reassign
      acc[option.name] = value;

      return acc;
    },
    {},
  );
}

function run(args) {
  if (['version', '--version'].includes(args[0])) {
    console.log(pjson.version);
    return;
  }

  if (['help', '--help'].includes(args[0])) {
    logger.info('Help');
    return;
  }

  const command = COMMANDS.find(cmd => cmd.name === args[0]);

  if (!command) {
    if (NOT_SUPPORTED_COMMANDS.includes(args[0])) {
      logger.info(messages.commandNotImplemented(args[0]));
    } else {
      logger.error(messages.commandNotFound(args[0]));
    }
    return;
  }

  const opts = command.options || [];

  const flags = camelcaseKeys(
    minimist(args, {
      string: opts.map(opt => opt.name),
    }),
  );

  const displayName = `haul ${command.name}`;

  try {
    command.action(validateOptions(opts, flags, displayName));
  } catch (error) {
    if (error instanceof MessageError) {
      logger.error(error.message);
    } else {
      logger.error(
        messages.commandFailed({
          command: displayName,
          error,
          stack: error.stack,
        }),
      );
    }
    process.exit(1);
  }
}

run(process.argv.slice(2));
