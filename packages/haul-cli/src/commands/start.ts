import yargs from 'yargs';
import legacyStartCommand from '@haul/core-legacy/build/commands/start';
import {
  DEFAULT_PORT,
  DEFAULT_CONFIG_FILENAME,
  INTERACTIVE_MODE_DEFAULT,
} from '@haul/core-legacy/build/constants';
import Runtime from '../Runtime';

export default function startCommand(runtime: Runtime): yargs.CommandModule {
  return {
    command: 'start',
    describe: 'Starts a new webpack server',
    builder: {
      port: {
        description: 'Port to run your webpack server',
        default: DEFAULT_PORT,
        type: 'number',
      },
      d: {
        alias: 'dev',
        description: 'Whether to build in development mode',
        default: true,
        type: 'boolean',
      },
      n: {
        alias: 'no-interactive',
        description:
          'Disables prompting the user if the port is already in use',
        default: !INTERACTIVE_MODE_DEFAULT,
        type: 'boolean',
      },
      m: {
        alias: 'minify',
        description: `Whether to minify the bundle, 'true' by default when dev=false`,
        type: 'boolean',
      },
      assetsDest: {
        description:
          'Path to directory where to store generated assets, eg. /tmp/dist',
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
      r: {
        alias: 'hotReloading',
        description: 'Enables hot reloading',
        default: true,
        type: 'boolean',
      },
    },
    async handler(argv: yargs.Arguments) {
      const {
        port,
        dev,
        'no-interactive': noInteractive,
        minify,
        assetsDest,
        config,
        eager,
        hotReloading,
      } = (argv as unknown) as {
        port: number;
        dev: boolean;
        'no-interactive'?: boolean;
        minify?: boolean;
        assetsDest?: string;
        config: string;
        eager: string;
        hotReloading: boolean;
      };

      let exitCode = 0;

      let parsedEager;
      const list = (eager || '').split(',').map(item => item.trim());
      if (list.length === 1 && (list[0] === 'true' || list[0] === 'false')) {
        parsedEager = list[0] === 'true' ? true : false;
      } else {
        parsedEager = list;
      }

      try {
        legacyStartCommand.action({
          port,
          dev,
          no_interactive: noInteractive,
          minify: minify === undefined ? !dev : minify,
          assetsDest,
          config,
          eager: parsedEager,
          hotReloading,
        });
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        exitCode = 1;
      } finally {
        runtime.complete(exitCode);
      }
    },
  };
}
