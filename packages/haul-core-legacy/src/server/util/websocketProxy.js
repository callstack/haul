/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/**
 * Proxy connection from single WebSockerServer by given path.
 */
function webSocketProxy(webSocketServer: *, path: string) {
  return {
    onConnection(handler: (socket: WebSocket) => void) {
      webSocketServer.on('connection', socket => {
        if (socket.upgradeReq.url.indexOf(path) === 0) {
          handler(socket);
        }
      });
    },
  };
}

module.exports = webSocketProxy;
