import yargs from 'yargs';
import Runtime from './Runtime';
import InspectorClient from './InspectorClient';
import initCommand from './commands/init';
import ramBundleCommand from './commands/ramBundle';
import legacyFallbackCommand from './commands/legacyFallback';
import reloadCommand from './commands/reload';
import startCommand from './commands/start';

export default async function main() {
  const {
    HAUL_INSPECTOR,
    HAUL_INSPECTOR_PORT,
    HAUL_INSPECTOR_HOST,
    HAUL_INSPECTOR_WAIT,
  } = process.env;
  const runtime = new Runtime(
    HAUL_INSPECTOR || HAUL_INSPECTOR_PORT || HAUL_INSPECTOR_HOST
      ? new InspectorClient(HAUL_INSPECTOR_HOST, HAUL_INSPECTOR_PORT)
      : undefined
  );

  await runtime.ready(
    Boolean(HAUL_INSPECTOR_WAIT) || HAUL_INSPECTOR === 'wait'
  );

  [
    initCommand,
    ramBundleCommand,
    reloadCommand,
    startCommand,
    legacyFallbackCommand,
  ]
    .reduce((yargsInstance, commandBuilder) => {
      const commandModule = commandBuilder(runtime) as yargs.CommandModule;
      return yargsInstance.command({
        ...commandModule,
        handler(...args) {
          runtime.startCommand(
            commandModule.command || 'unknown',
            process.argv
          );
          try {
            const results = commandModule.handler(...args) as
              | undefined
              | Promise<unknown>;
            if (results && results.catch) {
              results.catch(error => {
                runtime.unhandledError(error);
                runtime.complete(1);
              });
            }
          } catch (error) {
            runtime.unhandledError(error);
            runtime.complete(1);
          }
        },
      });
    }, yargs)
    .demandCommand(1)
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .version().argv;
}
