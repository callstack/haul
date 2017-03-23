/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * types.js
 */

export type Command = {
  name: string,
  description?: string,
  action: (ctx: Context, argv: Array<string>, args: Object) => void,
  options?: Array<{
    name: string,
    description?: string,
    parse?: (val: string) => any,
    default?: ((ctx: Context) => any) | any
  }>
};

export type LoggerPrintLogo = (offset?: number, enchance?: Function) => void;
type LoggerPrint = (...args: any[]) => void;
export type Logger = {
  clear: () => void,
  printLogo: LoggerPrintLogo,
  info: LoggerPrint,
  warn: LoggerPrint,
  error: LoggerPrint,
  success: LoggerPrint,
}

export type Context = {
  console: Logger
};
