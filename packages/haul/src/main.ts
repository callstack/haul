import ramBundleCommand from './commands/ramBundle';
import yargs from 'yargs';
import Runtime from './Runtime';
import InspectorClient from './InspectorClient';

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

  [ramBundleCommand]
    .reduce((yargsInstance, commandBuilder) => {
      return yargsInstance.command(commandBuilder(runtime));
    }, yargs)
    .demandCommand(1)
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .version().argv;
}
