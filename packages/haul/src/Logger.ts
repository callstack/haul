import { inspect } from 'util';
import { LoggerEvent } from 'haul-inspector-events';
import { container, color, modifier, pad, AnsiColor } from 'ansi-fragments';
import InspectorClient from './InspectorClient';

enum LoggerLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Done = 'done',
  Debug = 'debug',
}

const levelToColorMappings = {
  [LoggerLevel.Info]: 'blue' as AnsiColor,
  [LoggerLevel.Warn]: 'yellow' as AnsiColor,
  [LoggerLevel.Error]: 'red' as AnsiColor,
  [LoggerLevel.Done]: 'green' as AnsiColor,
  [LoggerLevel.Debug]: 'gray' as AnsiColor,
};

export default class Logger {
  static Level = LoggerLevel;

  constructor(private inspectorClient?: InspectorClient) {}

  info = this.createLoggingFunction(LoggerLevel.Info);
  warn = this.createLoggingFunction(LoggerLevel.Warn);
  error = this.createLoggingFunction(LoggerLevel.Error);
  done = this.createLoggingFunction(LoggerLevel.Done);
  debug = this.createLoggingFunction(LoggerLevel.Debug);

  print = (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  };

  private createLoggingFunction(level: LoggerLevel) {
    return (...args: unknown[]) => {
      if (this.inspectorClient) {
        this.inspectorClient.emitEvent(new LoggerEvent(level, args));
      }

      this.print(
        container(
          color(levelToColorMappings[level], modifier('bold', level)),
          pad(1),
          '▶︎',
          pad(1),
          args
            .map(item => (typeof item === 'string' ? item : inspect(item)))
            .join(' ')
        ).build()
      );
    };
  }
}
