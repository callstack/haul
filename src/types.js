/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * types.js
 */

type Command = {
  name: string,
  description: string,
  action: (ctx: Context) => void,
};

type Context = {};