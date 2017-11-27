/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
/* eslint-disable consistent-return */

const net = require('net');
const xpipe = require('xpipe');

const createFork = require('./utils/createFork');
const getFileFromPath = require('./utils/getFileFromPath');
const { parentEv, forkEv } = require('./utils/eventNames');
const RequestQueue = require('./utils/requestQueue');

type ConfigOptionsType = {
  root: string,
  dev: boolean,
  minify: boolean,
  port: number,
  platform: string,
};

type MiddlewareOptions = {
  configPath: string,
  configOptions: ConfigOptionsType,
};

/**
 * Gets proper IPC socket name, platform specific
 * @param {string} plat 
 */
const getSocket = plat => xpipe.eq(`/tmp/HAUL_SOCKET_${plat}_.socket`);

/**
 * Kills all forks and closes all connections
 * @param {string} err Error message to display/throw
 */
const closeAllConnections = err => {
  err && console.log('Exiting with error:', err);

  Object.keys(FORKS).forEach(plat => {
    FORKS[plat].fork.kill();
    FORKS[plat].server.close();
  });
  process.exit(0);
};

const FORKS = {};

const Queue = new RequestQueue();

/**
 * Throws error, saying which function failed
 * @param {string} funcName 
 */
const reportError = funcName => {
  closeAllConnections();
  throw new Error(
    `Middleware: No platform, ID or event to sendMessage. | ${funcName}`
  );
};

/**
 * on bundleSuccess, sends 
 * @param {string} platform 
 * @param {string} socket 
 */
const createSocketServer = platform => {
  return net.createServer({ allowHalfOpen: true }, connection => {
    let bundle = '';

    connection.setEncoding('utf-8');
    connection.on('data', chunk => {
      bundle += chunk;
    });
    connection.on('end', () => {
      FORKS[platform].listeners.forEach(response => {
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(bundle);
      });

      connection.end();
    });
    connection.on('close', () => {
      bundle = '';
      FORKS[platform].listeners = [];
    });
  });
};

/**
 * Sends a message to worker, with payload
 * @param {string} platform 
 * @param {Object} res 
 * @param {string} event 
 */
const sendMessage = (platform, res, event) => {
  const ID = Queue.addItem(res);

  if (!platform || ID === undefined || !event) reportError('sendMessage');

  FORKS[platform].fork.send({
    ID,
    event,
  });
};

/**
 * Handles received messages from parent
 * @param {Object} data {ID, event, payload}
 * @param {*} req express 'req'
 * @param {*} res express 'res'
 * @param {*} next express 'next'
 */
const receiveMessage = (data, req, res, next) => {
  const { ID, event, payload } = data;

  if (ID === undefined || !event) reportError('receiveMessage');

  switch (event) {
    case parentEv.buildFinished: {
      Queue.getSpecific(ID); // remove item
      break;
    }
    case parentEv.buildFailed: {
      const response = Queue.getSpecific(ID);
      response.end('BUNDLE FAILED');
      break;
    }
    case parentEv.errorMessaging: {
      closeAllConnections();
      throw new Error(`BAD COMMUNICATIONS: ${payload}`);
    }

    default: {
      console.log('Uhandled Event', event);
      next();
    }
  }
};

module.exports = function haulMiddlewareFactory(options: MiddlewareOptions) {
  return function webpackHaulMiddleware(req, res, next) {
    const { platform } = req.query;
    const fileName = getFileFromPath(req.path);

    if (!platform || !fileName) return next();
    const socket = getSocket(platform);

    // Fork creation
    if (!FORKS[platform]) {
      const platformSpecifics = {};
      platformSpecifics.fork = createFork(
        platform,
        `index.${platform}.bundle`,
        process.cwd(),
        __dirname,
        options,
        socket
      );

      platformSpecifics.listeners = [];
      platformSpecifics.fork.on('message', data =>
        receiveMessage(data, req, res, next)
      );
      platformSpecifics.server = createSocketServer(platform, socket).listen(
        socket
      );

      FORKS[platform] = platformSpecifics;
    }

    // request bundle
    FORKS[platform].listeners.push(res);
    sendMessage(platform, res, forkEv.requestBuild);
  };
};

process.on('uncaughtException', err => {
  closeAllConnections(err);
});

process.on('SIGINT', () => {
  closeAllConnections();
});
