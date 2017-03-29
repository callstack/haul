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
  description?: string,
  parse?: (val: string) => mixed,
  default?: string,
  example?: string,
  note?: string,
  choices?: Array<{
    value: string,
    description: string,
  }>,
};

export type Command = {
  name: string,
  description?: string,
  allowUnknownOptions?: boolean,
  action: (args: Object) => void | Promise<void>,
  options?: Array<CommandOption>,
};

export type WebpackStats = {
  hasWarnings: () => boolean,
  hasErrors: () => boolean,
};

export type LoggerPrintLogo = (offset?: number, enchance?: Function) => void;

type LoggerPrint = (...args: any[]) => void;

export type Logger = {
  clear: () => void,
  printLogo: LoggerPrintLogo,
  info: LoggerPrint,
  warn: LoggerPrint,
  error: LoggerPrint,
  done: LoggerPrint,
};
