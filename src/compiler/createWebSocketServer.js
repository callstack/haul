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

function getSocketAddress() {
  let address = null;
  let triesLeft = 20;
  while (!address && triesLeft > 0) {
    triesLeft--;
    address = xpipe.eq(
      `/tmp/HAUL_SOCKET_${Math.floor(
        Date.now() * Math.random() / 10000000
      )}_.socket`
    );
    if (fs.existsSync(address)) {
      address = null;
    }
  }

  if (!address) {
    throw new Error('Could not find any free socket address');
  }

  return address;
}

/**
 * Create WebSocket server using HTTP server over Unix socket.
 */
module.exports = function createWebSocketServer() {
  const socketAddress = getSocketAddress();

  const httpServer = http.createServer();
  const webSocketServer = new Server({
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 200 * 1024 * 1024,
  });

  httpServer.listen(socketAddress);

  return webSocketServer;
};
