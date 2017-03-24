/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * types.js
 *
 * @flow
 */

export type CommandArgs = Array<string>;

export type CommandOpts = Object;

export type Command = {
  name: string,
  description?: string,
  action: (argv: CommandArgs, args: CommandOpts) => void,
  options?: Array<{
    name: string,
    description?: string,
    parse?: (val: string) => any,
    default?: (() => any) | any
  }>
};

export type WebpackStats = {
  hasWarnings: () => boolean,
  hasErrors: () => boolean
};

export type LoggerPrintLogo = (offset?: number, enchance?: Function) => void;

type LoggerPrint = (...args: any[]) => void;

export type Logger = {
  clear: () => void,
  printLogo: LoggerPrintLogo,
  info: LoggerPrint,
  warn: LoggerPrint,
  error: LoggerPrint,
  success: LoggerPrint
};
