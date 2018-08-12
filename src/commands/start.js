/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const inquirer = require('inquirer');

const logger = require('../logger');
const createServer = require('../server');
const getWebpackConfigPath = require('../utils/getWebpackConfigPath');
const { isPortTaken, killProcess } = require('../utils/haulPortHandler');
const { DEFAULT_CONFIG_FILENAME, DEFAULT_PORT } = require('../constants');

/**
 * Starts development server
 */
async function start(opts: *) {
  const isTaken = await isPortTaken(opts.port);
  if (isTaken) {
    const { userChoice } = await inquirer.prompt({
      type: 'list',
      name: 'userChoice',
      message: `Port ${opts.port} is already in use. What should we do?`,
      choices: [`Kill process using port ${opts.port} and start Haul`, 'Quit'],
    });
    if (userChoice === 'Quit') {
      process.exit();
    }
    try {
      await killProcess(opts.port);
    } catch (e) {
      logger.error(`Could not kill process! Reason: \n ${e.message}`);
      process.exit(1);
    }
    logger.info(`Successfully killed processes.`);
  }

  const directory = process.cwd();
  const configPath = getWebpackConfigPath(directory, opts.config);

  const configOptions = {
    root: directory,
    dev: opts.dev,
    minify: opts.minify,
    port: opts.port,
    eager: opts.eager,
  };

  createServer({
    configPath,
    configOptions,
  }).listen(opts.port);
}

module.exports = ({
  name: 'start',
  description: 'Starts a new webpack server',
  action: start,
  options: [
    {
      name: 'port',
      description: 'Port to run your webpack server',
      default: DEFAULT_PORT,
      parse: Number,
    },
    {
      name: 'dev',
      description: 'Whether to build in development mode',
      default: true,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description: 'Builds in development mode',
        },
        {
          value: false,
          description: 'Builds in production mode',
        },
      ],
    },
    {
      name: 'minify',
      description: `Whether to minify the bundle, 'true' by default when dev=false`,
      default: ({ dev }: *) => !dev,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description: 'Enables minification for the bundle',
        },
        {
          value: false,
          description: 'Disables minification for the bundle',
        },
      ],
    },
    {
      name: 'config',
      description: `Path to config file, eg. ${DEFAULT_CONFIG_FILENAME}`,
      default: DEFAULT_CONFIG_FILENAME,
    },
    {
      name: 'eager',
      description: `Disable lazy building for platforms (list is separated by ','), 'false' by default`,
      default: false,
      parse(val: string) {
        const list = val.split(',').map(_ => _.trim());
        if (list.length === 1 && (list[0] === 'true' || list[0] === 'false')) {
          return Boolean(list[0]);
        }
        return list;
      },
      example: 'haul bundle --eager ios,android',
    },
  ],
}: Command);
