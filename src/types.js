/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * types.js
 *
 * @flow
 */

export type CommandArgs = Array<string>;

export type CommandOption = {
  name: string,
  description: string,
  parse?: (val: string) => mixed,
  default?: mixed | ((opts: { [key: string]: string }) => mixed),
  example?: string,
  choices?: Array<{
    value: mixed,
    description: string,
  }>,
};

export type Command = {
  name: string,
  description: string,
  action: (args: Object) => void | Promise<void>,
  options?: Array<CommandOption>,
};

export type WebpackStats = {
  hasWarnings: () => boolean,
  hasErrors: () => boolean,
};

type LoggerPrint = (...args: any[]) => void;

export type Logger = {
  info: LoggerPrint,
  warn: LoggerPrint,
  error: LoggerPrint,
  done: LoggerPrint,
  debug: LoggerPrint,
};

export type ReactNativeStackFrame = {
  lineNumber: number,
  column: number,
  file: string,
  methodName: string,
};

export type ReactNativeStack = Array<ReactNativeStackFrame>;
