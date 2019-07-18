import { inspect } from 'util';
import fs from 'fs';
import path from 'path';
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
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Done = 'done',
}

const levelToPriorityMappings = {
  [LoggerLevel.Debug]: 0,
  [LoggerLevel.Info]: 1,
  [LoggerLevel.Done]: 2,
  [LoggerLevel.Warn]: 3,
  [LoggerLevel.Error]: 4,
};

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
  private logFile: number | undefined;
  private logAsJson = false;
  public minLoggingLevel: LoggerLevel = LoggerLevel.Info;

  constructor(private inspectorClient?: InspectorClient) {}

  enableFileLogging(filename: string, { json }: { json: boolean }) {
    const absFilename = path.isAbsolute(filename)
      ? filename
      : path.resolve(filename);
    this.logFile = fs.openSync(absFilename, 'a');
    this.logAsJson = json;
  }

  dispose() {
    if (this.logFile !== undefined) {
      fs.closeSync(this.logFile);
    }
  }

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
    return color(enhancer, this.stringify(args).join(' ')).build();
  };

  enhanceWithModifier = (enhancer: AnsiModifier, ...args: unknown[]) => {
    return modifier(enhancer, this.stringify(args).join(' ')).build();
  };

  enhance = (level: LoggerLevel, ...args: unknown[]) => {
    return container(
      color(levelToColorMappings[level], modifier('bold', level)),
      pad(1),
      '▶︎',
      pad(1),
      this.stringify(args).join(' ')
    ).build();
  };

  stringify(args: any[]) {
    return args.map(item => (typeof item === 'string' ? item : inspect(item)));
  }

  private createLoggingFunction(level: LoggerLevel) {
    return (...args: unknown[]) => {
      if (this.inspectorClient) {
        this.inspectorClient.emitEvent(new LoggerEvent(level, args));
      }

      if (this.logFile !== undefined) {
        fs.appendFileSync(
          this.logFile,
          (this.logAsJson
            ? JSON.stringify({ timestamp: new Date(), level, messages: args })
            : `[${new Date().toISOString()}] ${level}: ${this.stringify(
                args
              ).join()}`) + '\n',
          'utf8'
        );
      }

      if (
        levelToPriorityMappings[level] >=
        levelToPriorityMappings[this.minLoggingLevel]
      ) {
        if (this.proxyHandler) {
          this.proxyHandler(level, ...args);
        } else {
          this.print(this.enhance(level, ...args));
        }
      }
    };
  }
}
