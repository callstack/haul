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
      return yargsInstance.command(commandBuilder(runtime));
    }, yargs)
    .demandCommand(1)
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .version().argv;
}
