/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * polyfillEnvironment.js
 * 
 * @flow
 */

const dedent = require("dedent");

class MessageError extends Error {
  constructor(msg: string, code?: string) {
    super(dedent(msg));
    this.code = code;
  }

  code: ?string;
}

exports.MessageError = MessageError;