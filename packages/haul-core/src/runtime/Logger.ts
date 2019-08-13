import { inspect } from 'util';
import fs from 'fs';
import path from 'path';
import stripAnsi from 'strip-ansi';
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

  /**
   * Enables logging all messages to file as well as to process' STDOUT.
   * If `json` is `true` each log will be in JSON format for easier processing.
   * If relative `filename` is passed, it will be resolved based on process' CWD.
   */
  enableFileLogging(filename: string, { json }: { json: boolean }) {
    const absFilename = path.isAbsolute(filename)
      ? filename
      : path.resolve(filename);
    this.logFile = fs.openSync(absFilename, 'a');
    this.logAsJson = json;
  }

  /**
   * Disposes the logger by closing all open handles.
   * If file logging was enabled, the file descriptor will be closed here.
   * Should always be called before exiting from process.
   */
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

  /**
   * Enables proxy for all logs.
   * Messages will be passed to `handler` function and __won't be logged__ to process' STDOUT.
   * Returns a dispose function to disable the proxy.
   */
  proxy = (handler: ProxyHandler): (() => void) => {
    this.proxyHandler = handler;
    return () => {
      this.proxyHandler = undefined;
    };
  };

  /**
   * Prints arguments _as is_ without any processing.
   */
  print = (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  };

  /**
   * Enhances given arguments with ANSI color.
   */
  enhanceWithColor = (enhancer: AnsiColor, ...args: unknown[]) => {
    return color(enhancer, this.stringify(args).join(' ')).build();
  };

  /**
   * Enhances given arguments with ANSI modifier, for example with `bold`, `italic` etc.
   */
  enhanceWithModifier = (enhancer: AnsiModifier, ...args: unknown[]) => {
    return modifier(enhancer, this.stringify(args).join(' ')).build();
  };

  /**
   * Enhances given arguments with level prefix.
   * Example: info ▶︎ argument1 argument2
   */
  enhanceWithLevel = (level: LoggerLevel, ...args: unknown[]) => {
    return container(
      color(levelToColorMappings[level], modifier('bold', level)),
      pad(1),
      '▶︎',
      pad(1),
      this.stringify(args).join(' ')
    ).build();
  };

  /**
   * Stringify array of elements into a string array.
   * Uses Node's built-in `util.inspect` function to stringify non-string elements.
   */
  stringify(args: any[]) {
    return args.map(item =>
      typeof item === 'string'
        ? item
        : inspect(item, {
            depth: null,
            maxArrayLength: null,
            breakLength: Infinity,
          })
    );
  }

  private createLoggingFunction(level: LoggerLevel) {
    return (...args: unknown[]) => {
      if (this.inspectorClient) {
        this.inspectorClient.emitEvent(new LoggerEvent(level, args));
      }

      if (this.logFile !== undefined) {
        const rawArgs = this.stringify(args).map(stripAnsi);
        fs.appendFileSync(
          this.logFile,
          (this.logAsJson
            ? stripAnsi(
                JSON.stringify({
                  timestamp: new Date(),
                  level,
                  messages: rawArgs,
                })
              )
            : `[${new Date().toISOString()}] ${level}: ${rawArgs.join(' ')}`) +
            '\n',
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
          this.print(this.enhanceWithLevel(level, ...args));
        }
      }
    };
  }
}
