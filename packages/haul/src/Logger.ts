import { LoggerEvent } from 'haul-inspector-events';
import InspectorClient from './InspectorClient';

enum LoggerLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Done = 'done',
  Debug = 'debug',
}

export default class Logger {
  constructor(private inspectorClient?: InspectorClient) {}

  info = this.createLoggingFunction(LoggerLevel.Info);
  warn = this.createLoggingFunction(LoggerLevel.Warn);
  error = this.createLoggingFunction(LoggerLevel.Error);
  done = this.createLoggingFunction(LoggerLevel.Done);
  debug = this.createLoggingFunction(LoggerLevel.Debug);

  private createLoggingFunction(level: LoggerLevel) {
    return (...args: unknown[]) => {
      if (this.inspectorClient) {
        this.inspectorClient.emitEvent(new LoggerEvent(level, args));
      }

      // TODO: make it pretty
      // eslint-disable-next-line no-console
      console.log(level, ...args);
    };
  }
}
