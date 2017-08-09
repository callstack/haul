/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from './types';

const minimist = require('minimist');
const camelcaseKeys = require('camelcase-keys');
const clear = require('clear');
const inquirer = require('inquirer');
const path = require('path');
const chalk = require('chalk');

const pjson = require('../package.json');
const logger = require('./logger');
const messages = require('./messages');
const { MessageError } = require('./errors');

const DEFAULT_COMMAND = require('./commands/start');

const COMMANDS: Array<Command> = [
  require('./commands/init'),
  require('./commands/start'),
  require('./commands/bundle'),
];

const NOT_SUPPORTED_COMMANDS = [
  'run-ios',
  'run-android',
  'library',
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

const getDisplayName = (command: string, opts: { [key: string]: mixed }) => {
  const list = Object.keys(opts).map(key => `--${key} ${String(opts[key])}`);

  const {
    npm_execpath: execPath,
    npm_lifecycle_event: scriptName,
    npm_config_argv: npmArgv,
  } = process.env;

  // Haul has been called directly
  if (!execPath || !scriptName || !npmArgv) {
    return `haul ${command} ${list.join(' ')}`;
  }

  const client = path.basename(execPath) === 'yarn.js' ? 'yarn' : 'npm';

  if (client === 'npm') {
    const argv = JSON.parse(npmArgv).original;

    return [
      'npm',
      ...(argv.includes('--') ? argv.slice(0, argv.indexOf('--')) : argv),
      '--',
      ...list,
    ].join(' ');
  }

  // Yarn doesn't have `npmArgv` support
  const lifecycleScript = process.env[`npm_package_scripts_${scriptName}`];

  // If it's `npm script` that already defines command, e.g. "start": "haul start"
  // then, `yarn run start --` is enough. Otherwise, command has to be set.
  const exec =
    lifecycleScript && lifecycleScript.includes(command)
      ? `yarn run ${scriptName}`
      : `yarn run ${scriptName} ${command}`;

  return `${exec} -- ${list.join(' ')}`;
};

async function validateOptions(options, flags) {
  const acc = {};
  const promptedAcc = {};

  for (const option of options) {
    const defaultValue =
      typeof option.default === 'function'
        ? option.default(acc)
        : option.default;

    const parse =
      typeof option.parse === 'function' ? option.parse : val => val;

    let value = flags[option.name] ? parse(flags[option.name]) : defaultValue;

    const missingValue = option.required && typeof value === 'undefined';
    const invalidOption =
      option.choices &&
      typeof value !== 'undefined' &&
      typeof option.choices.find(c => c.value === value) === 'undefined';

    if (missingValue || invalidOption) {
      const message = option.choices ? 'Select' : 'Enter';

      // eslint-disable-next-line no-await-in-loop
      const question = await inquirer.prompt([
        {
          type: option.choices ? 'list' : 'input',
          name: 'answer',
          message: `${message} ${option.description.toLowerCase()}`,
          choices: (option.choices || []).map(choice => ({
            name: `${String(choice.value)} - ${choice.description}`,
            value: choice.value,
            short: choice.value,
          })),
        },
      ]);

      value = option.choices ? question.answer : parse(question.answer);

      promptedAcc[option.name] = value;
    }

    acc[option.name] = value;
  }

  return { options: acc, promptedOptions: promptedAcc };
}

async function run(args: Array<string>) {
  if (
    args[0] === 'version' ||
    args.includes('-v') ||
    args.includes('--version')
  ) {
    console.log(`v${pjson.version}`);
    return;
  }

  if (['--help', '-h', 'help'].includes(args[0])) {
    console.log(messages.haulHelp(COMMANDS));
    return;
  }

  if (NOT_SUPPORTED_COMMANDS.includes(args[0])) {
    logger.info(messages.commandNotImplemented(args[0]));
    return;
  }

  const command = COMMANDS.find(cmd => cmd.name === args[0]) || DEFAULT_COMMAND;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(messages.haulCommandHelp(command));
    return;
  }

  const opts = command.options || [];

  const { _, ...flags } = camelcaseKeys(
    minimist(args, {
      string: opts.map(opt => opt.name),
    }),
  );

  const { options, promptedOptions } = await validateOptions(opts, flags);
  const userDefinedOptions = { ...flags, ...promptedOptions };
  const displayName = getDisplayName(command.name, userDefinedOptions);

  if (Object.keys(promptedOptions).length) {
    logger.info(`Running ${chalk.cyan(displayName)}`);
  }

  try {
    await command.action(options);
  } catch (error) {
    clear();
    if (error instanceof MessageError) {
      logger.error(error.message);
    } else {
      logger.error(
        messages.commandFailed({
          command: displayName,
          error,
          stack: error && error.stack,
        }),
      );
    }
    process.exit(1);
  }
}

module.exports = run;
module.exports.validateOptions = validateOptions;
