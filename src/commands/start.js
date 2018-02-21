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
const getWebpackConfig = require('../utils/getWebpackConfig');
const { isPortTaken, killProcess } = require('../utils/haulPortHandler');

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
  const configPath = getWebpackConfig(directory, opts.config);
  const configOptions = {
    root: directory,
    dev: opts.dev,
    minify: opts.minify,
    port: opts.port,
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
      default: 8081,
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
      description: 'Path to config file, eg. webpack.haul.js',
      default: 'haul.config.js',
    },
  ],
}: Command);
