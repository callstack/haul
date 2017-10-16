/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * types.js
 *
 * @flow
 */

type Choice = {
  value: string | boolean | number,
  description: string,
};

export type CommandOption = {
  name: string,
  description: string,
  parse?: Function,
  default?: any,
  example?: string,
  choices?: Array<Choice>,
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
  toJson: ({ [key: string]: any }) => { [key: string]: any },
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
