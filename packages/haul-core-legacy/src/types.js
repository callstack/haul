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
  adjustOptions?: (options: Object) => void,
};

export type ConfigOptions = {|
  root: string,
  assetsDest: string,
  dev: boolean,
  minify?: boolean,
  bundle?: boolean,
  port?: number,
  providesModuleNodeModules?: (string | { name: string, directory: string })[],
  hasteOptions?: *,
  initializeCoreLocation?: string,
  disableHotReloading?: boolean,
  maxWorkers?: number,
|};

export type EnvOptions = {|
  ...ConfigOptions,
  platform: Platform,
|};

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
  reset: () => Logger,
};

export type ReactNativeStackFrame = {
  lineNumber: number,
  column: number,
  file: string,
  methodName: string,
};

export type ReactNativeStack = Array<ReactNativeStackFrame>;

export type Platform = string;
