import { Runtime } from '@haul-bundler/core';
import legacyInitCommand from '@haul-bundler/core-legacy/build/commands/init';

export default function initCommand(runtime: Runtime) {
  return {
    command: 'init',
    describe: 'Generates necessary configuration files',
    async handler() {
      let exitCode = 0;
      try {
        legacyInitCommand.action();
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        exitCode = 1;
      } finally {
        runtime.complete(exitCode);
      }
    },
  };
}
