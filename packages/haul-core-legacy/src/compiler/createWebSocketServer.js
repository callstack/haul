/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const getPort = require('get-port');
const http = require('http');
const { Server } = require('ws');

/**
 * Create WebSocket server using HTTP server over Unix socket.
 */
module.exports = async function createWebSocketServer() {
  const httpServer = http.createServer();
  const webSocketServer = new Server({
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 200 * 1024 * 1024,
  });

  const port = await getPort();
  httpServer.listen(port);

  return webSocketServer;
};
