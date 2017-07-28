/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
export type Option = {
  name: string,
  default: () => * | string,
  description: string,
  example?: string,
  parse?: () => *,
  choices?: Array<{ value: string, description: string }>,
};

export type Command = {
  name: string,
  description: string,
  action: () => void,
  options?: Array<{}>,
};
