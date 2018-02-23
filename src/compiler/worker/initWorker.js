/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const path = require('path');
const WebSocket = require('ws');
const MemoryFileSystem = require('memory-fs');
const Events = require('../events');
const runWebpackCompiler = require('./runWebpackCompiler');

module.exports = function initWorker({
  platform,
  // fileOutput,
  options,
  socketAddress,
}: {
  [key: string]: string,
}) {
  const fs = new MemoryFileSystem();
  const webSocket = new WebSocket(
    `ws+unix://${socketAddress}:/?platform=${platform}`
  );

  function send(type, payload = {}) {
    webSocket.send(
      JSON.stringify({
        type,
        ...payload,
      })
    );
  }

  webSocket.on('open', () => {
    const compiler = runWebpackCompiler({
      platform,
      options,
      fs,
    });

    compiler.on(Events.BUILD_START, () => {
      send(Events.BUILD_START);
    });

    compiler.on(Events.BUILD_PROGRESS, payload => {
      send(Events.BUILD_PROGRESS, payload);
    });

    compiler.on(Events.BUILD_FINISHED, ({ error, stats }) => {
      send(Events.BUILD_FINISHED, {
        error,
        stats: stats ? stats.toJson() : null,
      });
    });

    compiler.emit('start');
  });

  webSocket.on('message', data => {
    const { type, ...payload } = JSON.parse(data.toString());

    if (type === Events.REQUEST_FILE) {
      const filename = path.join(process.cwd(), payload.filename);
      if (fs.existsSync(filename)) {
        send(Events.FILE_RECEIVED, {
          taskId: payload.taskId,
          file: fs.readFileSync(filename).toString(),
        });
      }
    } else {
      console.log(`Unknown event ${JSON.stringify(type)}`);
    }
  });
};
