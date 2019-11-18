import WebSocket from 'ws';
import { InspectorEvent } from '@haul-bundler/inspector-events';

export default class InspectorClient {
  socket?: WebSocket;
  shouldExit = false;
  buffer: InspectorEvent[] = [];
  onReady = () => {};

  constructor(host?: string, port?: string) {
    this.connect(
      `ws://${host || 'localhost'}:${port || 7777}?pid=${process.pid}`
    );
  }

  /**
   * Used only when Haul process should wait for connection with inspector.
   */
  async ready() {
    return new Promise(resolve => {
      this.onReady = resolve;
    });
  }

  close() {
    this.shouldExit = true;
    if (this.socket) {
      this.socket.close();
    }
  }

  private connect(address: string) {
    const socket = new WebSocket(address);
    const timeout = setTimeout(() => {
      socket.close();
      this.connect(address);
    }, 10000);

    socket.on('open', () => {
      this.socket = socket;
      clearTimeout(timeout);
      this.onReady();
      this.buffer.forEach(event => this.emitEvent(event));
    });

    socket.on('close', () => {
      this.socket = undefined;
      socket.close();
      if (!this.shouldExit) {
        setTimeout(() => {
          this.connect(address);
        }, 5000);
      }
    });

    socket.on('error', () => {
      this.socket = undefined;
      socket.close();
      if (!this.shouldExit) {
        setTimeout(() => {
          this.connect(address);
        }, 5000);
      }
    });
  }

  emitEvent(event: InspectorEvent) {
    if (this.socket) {
      this.socket.send(event.serialize());
    } else {
      this.buffer.push(event);
    }
  }
}
