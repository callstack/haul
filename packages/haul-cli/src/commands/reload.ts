import { Runtime, DEFAULT_PORT } from '@haul-bundler/core';
import legacyReloadCommand from '@haul-bundler/core-legacy/build/commands/reload';

export default function reloadCommand(runtime: Runtime) {
  return {
    command: 'reload',
    describe: 'Sends reload request to all devices that enabled live reload',
    builder: {
      port: {
        description: 'Port your webpack server is running on',
        default: DEFAULT_PORT,
        type: 'number',
      },
    },
    async handler() {
      let exitCode = 0;
      try {
        legacyReloadCommand.action();
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        exitCode = 1;
      } finally {
        runtime.complete(exitCode);
      }
    },
  };
}
