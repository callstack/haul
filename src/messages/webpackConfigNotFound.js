/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * webpackConfigNotFound.js
 * 
 * @flow
 */
const dedent = require('dedent');

module.exports = ({ path }: { path: string }) => dedent`
   We tried loading configuration file at ${path}.
`;
