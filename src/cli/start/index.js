/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { CommandArgs } from '../../types';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const clearConsole = require('../../utils/clearConsole');
const createServer = require('../../server');
const messages = require('../../messages');

const makeReactNativeConfig = require('../../utils/makeReactNativeConfig');

/**
 * Starts development server
 */
function start(argv: CommandArgs, opts: *) {
  const directory = process.cwd();
  const configPath = path.join(directory, 'webpack.haul.js');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      messages.webpackConfigNotFound({
        directory,
      }),
    );
  }

  const config = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      port: opts.port,
      dev: opts.dev,
      platform: opts.platform,
      cwd: process.cwd(),
    },
  );

  const compiler = new webpack(config);

  const app = createServer(
    compiler,
    didHaveIssues => {
      clearConsole();
      console.log(messages.bundleCompiling(didHaveIssues));
    },
    stats => {
      clearConsole();
      console.log(
        messages.bundleCompiled({
          stats,
          platform: opts.platform,
        }),
      );
    },
  );

  // $FlowFixMe Seems to have issues with `http.Server`
  app.listen(8081, '127.0.0.1', () => {
    console.log(
      messages.initialStartInformation({
        webpackConfig: config,
        port: opts.port,
      }),
    );
  });
}

module.exports = {
  name: 'start',
  description: 'Starts a new webpack server',
  action: start,
  options: [
    {
      name: '--port [number]',
      description: 'Port to run your webpack server',
      default: 8081,
      parse: (val: string) => +val,
    },
    {
      name: '--dev [true|false]',
      description: 'Whether to build in development mode',
      default: true,
      parse: (val: string) => JSON.parse(val),
    },
    {
      name: '--platform [ios|android]',
      description: 'Platform to bundle for',
      default: 'ios',
    },
  ],
};
