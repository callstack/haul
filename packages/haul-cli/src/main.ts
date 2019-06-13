import yargs from 'yargs';
import yargsParser from 'yargs-parser';
import { Runtime, InspectorClient } from '@haul-bundler/core';
import initCommand from './commands/init';
import bundleCommand from './commands/bundle';
import ramBundleCommand from './commands/ramBundle';
import reloadCommand from './commands/reload';
import startCommand from './commands/start';
import multiBundleCommand from './commands/multiBundle';

export default async function main() {
  const {
    HAUL_INSPECTOR,
    HAUL_INSPECTOR_PORT,
    HAUL_INSPECTOR_HOST,
    NODE_INSPECTOR,
  } = process.env;
  let { haulInspector, nodeInspector } = yargsParser(process.argv);
  haulInspector = haulInspector || HAUL_INSPECTOR;
  nodeInspector = nodeInspector || NODE_INSPECTOR;

  const runtime = new Runtime(
    haulInspector || HAUL_INSPECTOR_PORT || HAUL_INSPECTOR_HOST
      ? new InspectorClient(HAUL_INSPECTOR_HOST, HAUL_INSPECTOR_PORT)
      : undefined
  );

  await runtime.ready(haulInspector === 'wait');

  // Experimental
  if (nodeInspector) {
    const wait = nodeInspector === 'wait';
    runtime.nodeInspectorStarted(wait);
    const inspector = require('inspector');
    inspector.open(undefined, undefined, wait);
  }

  [
    initCommand,
    bundleCommand,
    ramBundleCommand,
    reloadCommand,
    startCommand,
    multiBundleCommand,
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
