/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const mime = require('mime-types');

const Events = require('../events');
const runWebpackCompiler = require('./runWebpackCompiler');

module.exports = function initWorker({
  platform,
  options,
  socketAddress,
}: {
  [key: string]: string,
}) {
  const webSocket = new WebSocket(
    `ws://${socketAddress}/?platform=${platform}`
  );

  function send(type, payload = {}) {
    webSocket.send(
      JSON.stringify({
        type,
        ...payload,
      })
    );
  }

  const outputPath = JSON.parse(options).configOptions.assetsDest;

  webSocket.on('open', async () => {
    let compiler;

    try {
      compiler = await runWebpackCompiler({
        platform,
        options,
      });
    } catch (e) {
      send(Events.BUILD_FAILED, { message: e.message });
      throw e;
    }

    compiler.on(Events.BUILD_START, () => {
      send(Events.BUILD_START);
    });

    compiler.on(Events.LOG, payload => {
      send(Events.LOG, payload);
    });

    compiler.on(Events.BUILD_FAILED, payload => {
      send(Events.BUILD_FAILED, payload);
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
      const filePath = path.join(outputPath, payload.filename);
      if (fs.existsSync(filePath)) {
        send(Events.FILE_RECEIVED, {
          taskId: payload.taskId,
          filePath,
          mimeType: mime.lookup(payload.filename) || 'text/javascript',
        });
      } else {
        send(Events.FILE_NOT_FOUND, {
          taskId: payload.taskId,
        });
      }
    } else {
      console.log(`Unknown event ${JSON.stringify(type)}`);
    }
  });
};
