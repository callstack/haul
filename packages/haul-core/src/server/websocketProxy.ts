import WebSocket from 'ws';
import { IncomingMessage } from 'http';

type WebsocketProxyOnConnectionHandler = (
  socket: WebSocket,
  request: IncomingMessage
) => void;
export type WebSocketProxy = {
  onConnection(handler: WebsocketProxyOnConnectionHandler): void;
};

/**
 * Proxy connection from single WebSocketServer by given path.
 */
export default function createWebSocketProxy(
  webSocketServer: WebSocket.Server,
  path: string
): WebSocketProxy {
  return {
    onConnection(handler: WebsocketProxyOnConnectionHandler) {
      webSocketServer.on('connection', (socket, request) => {
        if (request.url && request.url.startsWith(path)) {
          handler(socket, request);
        }
      });
    },
  };
}
