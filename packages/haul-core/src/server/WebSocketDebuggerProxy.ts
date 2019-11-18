import _WebSocket from 'ws';
import { Assign } from 'utility-types';
import { WebSocketProxy } from './websocketProxy';
import Runtime from '../runtime/Runtime';
import { IncomingMessage } from 'http';

type WebSocket = Assign<
  _WebSocket,
  {
    onerror?: _WebSocket['onerror'];
    onclose?: _WebSocket['onclose'];
    onmessage?: _WebSocket['onmessage'];
  }
>;

/**
 * Websocket proxy between debugger and React Native client
 */
export default class WebsocketDebuggerProxy {
  debuggerSocket: WebSocket | undefined;
  clientSocket: WebSocket | undefined;

  constructor(private runtime: Runtime, webSocketProxy: WebSocketProxy) {
    webSocketProxy.onConnection(this.onConnection.bind(this));
  }

  send(socket: WebSocket, message: string) {
    try {
      socket.send(message);
    } catch (error) {
      this.runtime.logger.warn('Failed to send data to socket', error);
    }
  }

  /**
   * Called everytime new WebSocket connection is established. Each specifies
   * `role` param, which we use to determine type of connection.
   */
  onConnection(socket: WebSocket, request: IncomingMessage) {
    const { url = '' } = request;
    if (url.indexOf('role=debugger') >= 0) {
      this.runtime.logger.info('Chrome Remote debugger connected');
      this.handleDebuggerSocket(socket);
    } else if (url.indexOf('role=client') >= 0) {
      this.runtime.logger.info('React Native debugger client connected');
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
  handleDebuggerSocket(socket: WebSocket) {
    if (this.debuggerSocket) {
      socket.close(1011, 'Another debugger is already connected');
      return;
    }

    this.debuggerSocket = socket;

    const onCloseHandler = () => {
      this.runtime.logger.info('Chrome Remote debugger disconnected');
      this.debuggerSocket = undefined;
      if (this.clientSocket) {
        this.clientSocket.close(1011, 'Debugger was disconnected');
      }
    };

    this.debuggerSocket.onerror = onCloseHandler;
    this.debuggerSocket.onclose = onCloseHandler;

    this.debuggerSocket.onmessage = ({ data }) => {
      if (this.clientSocket) {
        this.send(this.clientSocket, data.toString());
      }
    };
  }

  /**
   * Client socket handler
   *
   * Note: New client automatically closes previous client connection
   */
  handleClientSocket(socket: WebSocket) {
    if (this.clientSocket) {
      this.clientSocket.onerror = undefined;
      this.clientSocket.onclose = undefined;
      this.clientSocket.onmessage = undefined;
      this.clientSocket.close(1011, 'Another client is connected');
    }

    const onCloseHandler = () => {
      this.runtime.logger.info('React Native debugger client disconnected');
      this.clientSocket = undefined;
      if (this.debuggerSocket) {
        this.send(
          this.debuggerSocket,
          JSON.stringify({ method: '$disconnected' })
        );
      }
    };

    this.clientSocket = socket;
    this.clientSocket.onerror = onCloseHandler;
    this.clientSocket.onclose = onCloseHandler;

    this.clientSocket.onmessage = ({ data }) => {
      if (this.debuggerSocket) {
        this.send(this.debuggerSocket, data.toString());
      }
    };
  }

  isDebuggerConnected() {
    return !!this.debuggerSocket;
  }
}
