/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');

module.exports = ({ errors }: { errors: string[] }) => {
  return dedent`
    Failed to compile.
 
${errors.join('\n\n')}
  `;
};
