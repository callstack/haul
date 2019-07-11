import { inspect } from 'util';
import { LoggerEvent } from '@haul-bundler/inspector-events';
import {
  container,
  color,
  modifier,
  pad,
  AnsiColor,
  AnsiModifier,
} from 'ansi-fragments';
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

type ProxyHandler = (level: LoggerLevel, ...args: unknown[]) => void;
export default class Logger {
  static Level = LoggerLevel;
  static LevelColorMapping = levelToColorMappings;

  private proxyHandler: ProxyHandler | undefined;

  constructor(private inspectorClient?: InspectorClient) {}

  info = this.createLoggingFunction(LoggerLevel.Info);
  warn = this.createLoggingFunction(LoggerLevel.Warn);
  error = this.createLoggingFunction(LoggerLevel.Error);
  done = this.createLoggingFunction(LoggerLevel.Done);
  debug = this.createLoggingFunction(LoggerLevel.Debug);

  proxy = (handler: ProxyHandler): (() => void) => {
    this.proxyHandler = handler;
    return () => {
      this.proxyHandler = undefined;
    };
  };

  print = (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  };

  enhanceWithColor = (enhancer: AnsiColor, ...args: unknown[]) => {
    return color(
      enhancer,
      args
        .map(item => (typeof item === 'string' ? item : inspect(item)))
        .join(' ')
    ).build();
  };

  enhanceWithModifier = (enhancer: AnsiModifier, ...args: unknown[]) => {
    return modifier(
      enhancer,
      args
        .map(item => (typeof item === 'string' ? item : inspect(item)))
        .join(' ')
    ).build();
  };

  enhance = (level: LoggerLevel, ...args: unknown[]) => {
    return container(
      color(levelToColorMappings[level], modifier('bold', level)),
      pad(1),
      '▶︎',
      pad(1),
      args
        .map(item => (typeof item === 'string' ? item : inspect(item)))
        .join(' ')
    ).build();
  };

  private createLoggingFunction(level: LoggerLevel) {
    return (...args: unknown[]) => {
      if (this.inspectorClient) {
        this.inspectorClient.emitEvent(new LoggerEvent(level, args));
      }

      if (this.proxyHandler) {
        this.proxyHandler(level, ...args);
      } else {
        this.print(this.enhance(level, ...args));
      }
    };
  }
}
