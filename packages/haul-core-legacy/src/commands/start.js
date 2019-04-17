/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const fs = require('fs');
const inquirer = require('inquirer');
const os = require('os');
const path = require('path');

const logger = require('../logger');
const createServer = require('../server');
const getWebpackConfigPath = require('../utils/getWebpackConfigPath');
const { isPortTaken, killProcess } = require('../utils/haulPortHandler');
const {
  INTERACTIVE_MODE_DEFAULT,
  DEFAULT_CONFIG_FILENAME,
  DEFAULT_PORT,
} = require('../constants');

/**
 * Starts development server
 */
async function start(opts: *) {
  const isTaken = await isPortTaken(opts.port);
  if (isTaken) {
    if (!opts.no_interactive) {
      const { userChoice } = await inquirer.prompt({
        type: 'list',
        name: 'userChoice',
        message: `Port ${opts.port} is already in use. What should we do?`,
        choices: [
          `Kill process using port ${opts.port} and start Haul`,
          'Quit',
        ],
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
    } else {
      logger.error(
        `Could not spawn process! Reason: Port ${opts.port} already in use.`
      );
      process.exit(1);
    }
  }

  const directory = process.cwd();
  const configPath = getWebpackConfigPath(directory, opts.config);

  let assetsDest;
  if (opts.assetsDest) {
    assetsDest = path.isAbsolute(opts.assetsDest)
      ? opts.assetsDest
      : path.join(directory, opts.assetsDest);
  } else {
    assetsDest = fs.mkdtempSync(path.join(os.tmpdir(), 'haul-start-'));
  }

  const configOptions = {
    root: directory,
    assetsDest,
    dev: opts.dev,
    minify: opts.minify,
    port: opts.port,
    eager: opts.eager,
    disableHotReloading: !opts.hotReloading,
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
      name: 'no-interactive',
      description: 'Disables prompting the user if the port is already in use',
      default: !INTERACTIVE_MODE_DEFAULT,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description:
            'Will quit without prompting the user if the port is in use',
        },
        {
          value: false,
          description:
            'Will prompt the user with options if the port is currently in use',
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
      name: 'assetsDest',
      description:
        'Path to directory where to store generated assets, eg. /tmp/dist',
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
    {
      name: 'hotReloading',
      description: `Enables hot reloading`,
      default: true,
      parse: (val: string) => val !== 'false',
      choices: [
        {
          value: true,
          description: 'Enables hot reloading (default)',
        },
        {
          value: false,
          description: 'Disables hot reloading',
        },
      ],
    },
  ],
}: Command);
