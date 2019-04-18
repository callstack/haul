import yargs from 'yargs';
import WebSocket from 'ws';
import { formatServerMessage, formatServerError } from './formatters/server';
import { formatHaulMessage, formatHaulError } from './formatters/haul';

export default function main() {
  const { host, port } = yargs
    .option('port', {
      type: 'number',
      default: 7777,
      desc: 'Port number to listen for Haul processes',
    })
    .option('host', {
      type: 'string',
      default: 'localhost',
      desc: 'Host address to listen for Haul processes',
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .version().argv;

  const server = new WebSocket.Server({
    port,
    host,
  });

  server.on('connection', (socket, request) => {
    const pid = parseInt(
      (/pid=(\d+)/.exec(request.url || '') || ['', '-1'])[1],
      10
    );
    print(formatServerMessage(`haul(${pid}) process connected`));

    socket.on('message', data => {
      print(formatHaulMessage(pid, data.toString()));
    });

    socket.on('close', () => {
      print(formatServerMessage(`haul(${pid}) process disconnected`));
    });

    socket.on('error', error => {
      print(formatHaulError(pid, error));
    });
  });

  server.on('error', error => {
    print(formatServerError(error));
  });

  server.on('listening', () => {
    print(formatServerMessage(`listening on ${host}:${port}`));
  });
}

function print(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
}
