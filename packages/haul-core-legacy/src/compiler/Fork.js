/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { Platform } from '../types';

const fs = require('fs');
const EventEmitter = require('events');
const Events = require('./events');
const createForkProcess = require('./createForkProcess');
const createWebSocketServer = require('./createWebSocketServer');

type ForkConstructorArgs = {
  platform: Platform,
  options: *,
};

const forks = {};
let transportServer;

/**
 * Fork class is a abstraction over fork process. It handles creation of the process,
 * communication over transport server (WebSocket server) and redirecting events from
 * Webpack compiler in fork process to Fork consumer.
 */
module.exports = class Fork extends EventEmitter {
  platform: Platform;
  process: any;
  socket: WebSocket;
  enqueuedMessages: any[];
  isProcessing: boolean;

  constructor({ platform, options }: ForkConstructorArgs) {
    super();

    if (!transportServer) {
      transportServer = createWebSocketServer();

      // WebSocket connection is established after the Fork is created.
      transportServer.on('connection', (socket, req) => {
        const platformMatch = req.url.match(/platform=([^&]*)/);

        if (!platformMatch) {
          throw new Error('Incorrect platform');
        }

        forks[platformMatch[1]].setSocket(socket);

        socket.on('error', err => {
          this.emit(Events.BUILD_FAILED, {
            message: `Socket: ${err}`,
          });
          throw err;
        });
      });
    }

    this.isProcessing = true;
    this.enqueuedMessages = [];
    this.platform = platform;
    this.process = createForkProcess(
      platform,
      __dirname,
      transportServer.options.server.address(),
      options
    );

    forks[platform] = this;
  }

  setSocket(socket: WebSocket) {
    this.socket = socket;

    // Flush enqueued messages.
    this.enqueuedMessages.forEach(({ type, ...payload }) =>
      this.send(type, payload)
    );
    this.enqueuedMessages = [];

    // $FlowFixMe
    this.socket.addEventListener('message', ({ data }) => {
      const { type, ...payload } = JSON.parse(data.toString());

      if (type === Events.BUILD_FINISHED && !payload.error) {
        this.isProcessing = false;
      } else if (
        type === Events.BUILD_START ||
        (type === Events.BUILD_FINISHED && payload.error)
      ) {
        this.isProcessing = true;
      }

      this.emit(type, {
        platform: this.platform,
        ...payload,
      });
    });
  }

  send(type: string, payload: any = {}) {
    if (this.socket) {
      this.socket.send(JSON.stringify({ type, ...payload }));
    } else {
      this.enqueuedMessages.push({ type, ...payload });
    }
  }

  terminate() {
    this.process.kill();
    delete forks[this.platform];
    if (this.socket) {
      this.socket.close();
    }

    if (transportServer && !Object.keys(forks).length) {
      const socketAddress = transportServer.options.server.address();
      if (fs.existsSync(socketAddress)) {
        fs.unlinkSync(socketAddress);
      }
      transportServer.close();
    }
  }
};
