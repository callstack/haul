/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const webpack = require("webpack");
const createServer = require("../../server");
const path = require("path");
const fs = require("fs");

const logger = require("../../logger");
const { MessageError } = require("../../errors");

const makeReactNativeConfig = require("../../utils/makeReactNativeConfig");

import type { CommandArgs } from "../../types";

/**
 * Starts development server
 */
function start(argv: CommandArgs, opts: *) {
  const configPath = path.join(process.cwd(), "webpack.config.js");

  if (!fs.existsSync(configPath)) {
    throw new MessageError(
      `Config file couldn't be located at ${configPath}.
       Please make sure it exists.`
    );
  }

  const config = makeReactNativeConfig(
    // $FlowFixMe: Dynamic require
    require(configPath),
    {
      port: opts.port,
      dev: opts.dev,
      platform: opts.platform,
      cwd: process.cwd()
    }
  );

  const compiler = new webpack(config);

  const app = createServer(compiler);

  // $FlowFixMe Seems to have issues with `http.Server`
  app.listen(8081, "127.0.0.1", () => {
    logger.info("Starting server on http://localhost:8081");
  });
}

module.exports = {
  name: "start",
  description: "Starts a new Webpack server",
  action: start,
  options: [
    {
      name: "--port [number]",
      description: "Port to run your webpack server",
      default: 8081,
      parse: (val: string) => +val
    },
    {
      name: "--dev [true|false]",
      description: "Whether build in development mode",
      default: true,
      parse: (val: string) => JSON.parse(val)
    },
    {
      name: "--platform [ios|android]",
      description: "Platform to bundle for",
      default: "ios"
    }
  ]
};
