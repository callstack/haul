/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * types.js
 */

type Command = {
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

type Context = {
  console: any
};
