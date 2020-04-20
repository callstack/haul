import yargs from 'yargs';
import yargsParser from 'yargs-parser';
import { Logger, Runtime } from '@haul-bundler/core';
import initCommand from './commands/init';
import bundleCommand from './commands/bundle';
import ramBundleCommand from './commands/ramBundle';
import reloadCommand from './commands/reload';
import startCommand from './commands/start';
import multiBundleCommand from './commands/multiBundle';

export default async function main() {
  const { NODE_INSPECTOR } = process.env;
  let { nodeInspector } = yargsParser(process.argv);
  nodeInspector = nodeInspector || NODE_INSPECTOR;

  const runtime = new Runtime();

  // Experimental
  if (nodeInspector) {
    const wait = nodeInspector === 'wait';
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
          if (args[0].verbose) {
            runtime.logger.minLoggingLevel = Logger.Level.Debug;
          }

          if (args[0].outputFile && typeof args[0].outputFile === 'string') {
            runtime.logger.enableFileLogging(args[0].outputFile, {
              json: Boolean(args[0].json),
            });
          }

          try {
            const results = commandModule.handler(...args) as
              | undefined
              | Promise<unknown>;
            if (results?.catch) {
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
    .option('verbose', {
      describe: 'Print all logs including debug messages.',
      type: 'boolean',
    })
    .option('output-file <filename>', {
      describe: 'Log all messages to a file.',
      type: 'string',
    })
    .option('json', {
      describe: 'When --output-file is set, log each message as a JSON object.',
      type: 'boolean',
    })
    .version().argv;
}
