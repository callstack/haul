/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

const xpipe = require('xpipe');
const http = require('http');
const { Server } = require('ws');
const fs = require('fs');

/**
 * Create WebSocket server using HTTP server over Unix socket.
 */
module.exports = function createWebSocketServer() {
  const socketAddress = xpipe.eq(`/tmp/HAUL_SOCKET_.socket`);

  if (fs.existsSync(socketAddress)) {
    fs.unlinkSync(socketAddress);
  }

  const httpServer = http.createServer();
  const webSocketServer = new Server({ server: httpServer });

  httpServer.listen(socketAddress);

  return webSocketServer;
};
