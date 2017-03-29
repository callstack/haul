/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
const dedent = require('dedent');

module.exports = (didHaveIssues: boolean) => {
  if (didHaveIssues) {
    return dedent`
      Building after issues...

      This may take longer than usual
    `;
  }

  return 'Building...';
};
