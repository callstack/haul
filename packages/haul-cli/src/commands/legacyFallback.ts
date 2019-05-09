import path from 'path';
import { execSync } from 'child_process';
import { Argv } from 'yargs';
import { Runtime } from '@haul-bundler/core';

export default function legacyFallbackCommand(runtime: Runtime) {
  return {
    command: '*',
    describe: '',
    builder(yargs: Argv) {
      return yargs;
    },
    handler() {
      const rawArgv = process.argv.slice(2);
      runtime.logger.info(
        'Fallback to legacy commands with arguments:',
        rawArgv
      );

      const haulCoreLegacy = path.join(
        path.dirname(require.resolve('@haul-bundler/core-legacy')),
        '../bin/cli.js'
      );
      runtime.logger.info('Resolved binary to:', haulCoreLegacy);

      const command = `${process.execPath} ${haulCoreLegacy} ${rawArgv.join(
        ' '
      )}`;
      runtime.logger.info('Running:', command);
      execSync(command, {
        stdio: 'inherit',
      });
      runtime.complete();
    },
  };
}
