/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const WebSocketServer = require('ws').Server;

/**
 * Sends message to a given socket
 */
const send = (socket, message) => {
  try {
    socket.send(message);
  } catch (e) {
    console.warn(e);
  }
};

/**
 * Websocket proxy between debugger and React Native client
 */
class WebSocketProxy {
  constructor(server, path) {
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', this.onConnection.bind(this));
  }

  /**
   * Called everytime new WebSocket connection is established. Each specifies
   * `role` param, which we use to determine type of connection.
   */
  onConnection(socket) {
    const { url } = socket.upgradeReq;

    if (url.indexOf('role=debugger') >= 0) {
      this.handleDebuggerSocket(socket);
    } else if (url.indexOf('role=client') >= 0) {
      this.handleClientSocket(socket);
    } else {
      socket.close(1011, 'Missing role param');
    }
  }

  /**
   * Debugger socket handler
   *
   * Note: When debugger is already connected, new connection gets
   * closed automatically
   */
  handleDebuggerSocket(socket) {
    if (this.debuggerSocket) {
      socket.close(1011, 'Another debugger is already connected');
      return;
    }

    this.debuggerSocket = socket;

    const onCloseHandler = () => {
      this.debuggerSocket = null;
      if (this.clientSocket) {
        this.clientSocket.close(1011, 'Debugger was disconnected');
      }
    };

    this.debuggerSocket.onerror = onCloseHandler;
    this.debuggerSocket.onclose = onCloseHandler;

    this.debuggerSocket.onmessage = ({ data }) => {
      if (this.clientSocket) {
        send(this.clientSocket, data);
      }
    };
  }

  /**
   * Client socket handler
   *
   * Note: New client automatically closes previous client connection
   */
  handleClientSocket(socket) {
    if (this.clientSocket) {
      this.clientSocket.onerror = null;
      this.clientSocket.onclose = null;
      this.clientSocket.onmessage = null;
      this.clientSocket.close(1011, 'Another client is connected');
    }

    const onCloseHandler = () => {
      this.clientSocket = null;
      if (this.debuggerSocket) {
        send(this.debuggerSocket, JSON.stringify({ method: '$disconnected' }));
      }
    };

    this.clientSocket = socket;
    this.clientSocket.onerror = onCloseHandler;
    this.clientSocket.onclose = onCloseHandler;

    this.clientSocket.onmessage = ({ data }) => {
      if (this.debuggerSocket) {
        send(this.debuggerSocket, data);
      }
    };
  }

  isDebuggerConnected() {
    return !!this.debuggerSocket;
  }
}

module.exports = WebSocketProxy;
