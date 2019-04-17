import WebSocket from 'ws';
import { InspectorEvent } from 'haul-inspector-events';

export default class InspectorClient {
  socket?: WebSocket;
  buffer: InspectorEvent[] = [];
  onReady = () => {};

  constructor(host?: string, port?: string) {
    this.connect(`ws://${host || 'localhost'}:${port || 7777}`);
  }

  /**
   * Used only when Haul process should wait for connection with inspector.
   */
  async ready() {
    return new Promise(resolve => {
      this.onReady = resolve;
    });
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
      this.buffer.forEach(event => this.emitEvent(event));
    });

    socket.on('close', () => {
      this.socket = undefined;
      socket.close();
      setTimeout(() => {
        this.connect(address);
      }, 5000);
    });

    socket.on('error', () => {
      this.socket = undefined;
      socket.close();
      setTimeout(() => {
        this.connect(address);
      }, 5000);
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
