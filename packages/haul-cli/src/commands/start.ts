import yargs from 'yargs';
import {
  DEFAULT_PORT,
  DEFAULT_CONFIG_FILENAME,
  INTERACTIVE_MODE_DEFAULT,
  getProjectConfigPath,
  getNormalizedProjectConfigBuilder,
  Server,
} from '@haul-bundler/core';
import { Runtime } from '@haul-bundler/core';
import inquirer from 'inquirer';
import net from 'net';
import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

export default function startCommand(runtime: Runtime) {
  return {
    command: 'start',
    describe: 'Starts a new webpack server',
    builder: {
      port: {
        description: 'Port to run your webpack server',
        default: DEFAULT_PORT,
        type: 'number',
      },
      dev: {
        description: 'Whether to build in development mode',
        default: true,
        type: 'boolean',
      },
      'no-interactive': {
        description:
          'Disables prompting the user if the port is already in use',
        default: !INTERACTIVE_MODE_DEFAULT,
        type: 'boolean',
      },
      minify: {
        description: `Whether to minify the bundle, 'true' by default when dev=false`,
        type: 'boolean',
      },
      tempDir: {
        description:
          'Path to directory where to store temporary files, eg. /tmp/dist',
        type: 'string',
      },
      config: {
        description: `Path to config file, eg. ${DEFAULT_CONFIG_FILENAME}`,
        default: DEFAULT_CONFIG_FILENAME,
        type: 'string',
      },
      eager: {
        description: `Disable lazy building for platforms (list is separated by ',', for example 'haul bundle --eager ios,android')`,
        default: 'false',
        type: 'string',
      },
    },
    async handler(
      argv: yargs.Arguments<{
        port: number;
        dev: boolean;
        'no-interactive'?: boolean;
        minify?: boolean;
        tempDir?: string;
        config: string;
        eager: string;
      }>
    ) {
      let parsedEager;
      const list = (argv.eager || '').split(',').map(item => item.trim());
      if (list.length === 1 && (list[0] === 'true' || list[0] === 'false')) {
        parsedEager = list[0] === 'true' ? ['ios', 'android'] : [];
      } else {
        parsedEager = list;
      }

      const directory = process.cwd();

      let tempDir: string;
      if (argv.tempDir) {
        tempDir = path.isAbsolute(argv.tempDir)
          ? argv.tempDir
          : path.join(directory, argv.tempDir);
      } else {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'haul-start-'));
      }

      const configPath = getProjectConfigPath(directory, argv.config);
      const projectConfig = getNormalizedProjectConfigBuilder(configPath)(
        runtime,
        {
          platform: '',
          root: directory,
          dev: argv.dev,
          port: argv.port,
          bundleMode: 'multi-bundle',
          bundleTarget: 'server',
          assetsDest: tempDir,
          minify: argv.minify === undefined ? !argv.dev : argv.minify,
        }
      );

      try {
        const isTaken = await isPortTaken(
          projectConfig.server.port,
          projectConfig.server.host
        );
        if (isTaken) {
          if (!argv.noInteractive) {
            const { userChoice } = await inquirer.prompt({
              type: 'list',
              name: 'userChoice',
              message: `Port ${
                projectConfig.server.port
              } is already in use. What should we do?`,
              choices: [
                `Kill process using port ${
                  projectConfig.server.port
                } and start Haul`,
                'Quit',
              ],
            });
            if (userChoice === 'Quit') {
              runtime.complete(0);
            }
            try {
              await killProcess(projectConfig.server.port);
            } catch (e) {
              runtime.logger.error(
                `Could not kill process! Reason: \n ${e.message}`
              );
              runtime.complete(1);
            }
            runtime.logger.info(`Successfully killed processes.`);
          } else {
            runtime.logger.error(
              `Could not spawn process! Reason: Port ${
                projectConfig.server.port
              } already in use.`
            );
            runtime.complete(1);
          }
        }

        new Server(runtime, configPath, {
          dev: argv.dev,
          noInteractive: Boolean(argv.noInteractive),
          minify: argv.minify === undefined ? !argv.dev : argv.minify,
          assetsDest: tempDir,
          root: directory,
          eager: parsedEager,
          platforms: projectConfig.platforms,
          bundleNames: Object.keys(projectConfig.bundles),
        }).listen(projectConfig.server.host, projectConfig.server.port);
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        runtime.complete(1);
      }
    },
  };
}

/*
 * Check if the port is already in use
 */
function isPortTaken(port: number, host: string): Promise<boolean> {
  return new Promise(resolve => {
    const portTester = net
      .createServer()
      .once('error', () => {
        return resolve(true);
      })
      .once('listening', () => {
        portTester.close();
        resolve(false);
      })
      .listen(port, host);
  });
}

function killProcess(port: number): Promise<boolean> {
  /*
   * Based on platform, decide what service
   * should be used to find process PID
   */
  const serviceToUse =
    process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -n -i:${port} | grep LISTEN`;

  return new Promise(resolve => {
    /*
     * Find PID that is listening at given port
     */
    exec(serviceToUse, (error, stdout) => {
      if (error) {
        /*
         * Error happens if no process found at given port
         */
        resolve(false);
        return;
      }
      /*
       * If no error, port is in use
       * And that port is used only by one process
       */
      const PIDInfo = stdout
        .trim()
        .split('\n')[0]
        .split(' ')
        .filter(entry => entry);

      /* macOSX/Linux: PID is placed at index 1
       * Windows: PID is placed at last index
       */
      const index = process.platform === 'win32' ? PIDInfo.length - 1 : 1;

      const PID = PIDInfo[index];

      /*
       * Kill process
       */
      process.kill(parseInt(PID, 10), 'SIGKILL');

      resolve(true);
    });
  });
}
