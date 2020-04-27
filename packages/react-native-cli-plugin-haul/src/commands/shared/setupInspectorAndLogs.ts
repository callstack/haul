import { Logger, Runtime } from '@haul-bundler/core';

const setupInspectorAndLogs = (argv: {
  nodeInspector?: string;
  verbose?: boolean;
  outputFile?: string;
  json?: boolean
}, runtime: Runtime) => {
  const { NODE_INSPECTOR } = process.env;
  const nodeInspector = argv.nodeInspector || NODE_INSPECTOR;

  if (nodeInspector) {
    const wait = nodeInspector === 'wait';
    const inspector = require('inspector');
    inspector.open(undefined, undefined, wait);
  }

  if (argv.verbose) {
    runtime.logger.minLoggingLevel = Logger.Level.Debug;
  }

  if (argv.outputFile && typeof argv.outputFile === 'string') {
    runtime.logger.enableFileLogging(argv.outputFile, {
      json: Boolean(argv.json),
    });
  }
}

export default setupInspectorAndLogs