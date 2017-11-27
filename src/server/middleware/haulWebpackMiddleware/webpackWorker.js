/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
/* Required modules */
require('babel-register');

const path = require('path');
const webpack = require('webpack');
const MemoryFileSystem = require('memory-fs');
const net = require('net');

/**
 * Get env vars
 */
const {
  HAUL_PLATFORM,
  HAUL_OPTIONS: optionsPassed,
  HAUL_FILEOUTPUT,
  HAUL_DIRECTORY,
  HAUL_SOCKET,
} = process.env;

/**
 * Import custom modules
 */
const workerShared = require(path.resolve(
  HAUL_DIRECTORY,
  './utils/workerShared'
));

const { parentEv, forkEv } = require(path.resolve(
  HAUL_DIRECTORY,
  './utils/eventNames'
));
/**
 * Get Webpack config
 */
const HAUL_OPTIONS = JSON.parse(optionsPassed);
const { configPath, configOptions } = HAUL_OPTIONS;
const getConfig = require(path.resolve(HAUL_DIRECTORY, './utils/getConfig'));
const config = getConfig(configPath, configOptions, HAUL_PLATFORM);

const context = {
  webpackState: undefined,
  fs: new MemoryFileSystem(),
  state: false,
  watching: undefined,
  forceRebuild: false,
  callbacks: [],
  compiler: null,
  onError: error => {
    sendMessage(-1, parentEv.buildFailed, error);
  },
};

/**
 * Set compiler options, set fs to Memory
 */
context.compiler = webpack(config);
context.compiler.outputFileSystem = context.fs;

/**
 * Add plugin hooks to webpack, setup callbacks etc.
 */
const shared = workerShared(context);

/**
 * Sends message to parent about error in message exchange
 */
const notifyParentMessageError = () => {
  sendMessage(
    -1,
    forkEv.errorMessaging,
    `From fork ${HAUL_PLATFORM}: No ID or event received. | sendMessage`
  );
};

const receiveMessage = data => {
  if (data.ID === undefined || !data.event) {
    notifyParentMessageError();
    return;
  }
  const taskID = data.ID;

  switch (data.event) {
    case forkEv.requestBuild: {
      shared.handleRequest(HAUL_FILEOUTPUT, () => processRequest(taskID));
      break;
    }
    default:
      notifyParentMessageError();
  }
};

const sendMessage = (ID, event, payload) => {
  if (ID === undefined || !event) {
    notifyParentMessageError();
    return;
  }

  // Pipe the bundle to the parent
  if (event === parentEv.buildFinished) {
    const fileReadStream = context.fs.createReadStream(payload);
    const conn = net.createConnection(HAUL_SOCKET);
    conn.setEncoding('utf-8');
    fileReadStream.pipe(conn);
  }

  process.send({
    platform: HAUL_PLATFORM,
    ID,
    event,
    payload,
  });
};

/**
 * Callback to `compiler.ready`, when webpack finishes bundle
 * Todo: need to change its behaviour based on errors in compiling
 * @param {number} ID 
 */
const processRequest = ID => {
  const filePath = path.join(process.cwd(), HAUL_FILEOUTPUT);
  sendMessage(ID, parentEv.buildFinished, filePath);
};

process.on('message', receiveMessage);
