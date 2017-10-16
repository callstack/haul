/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 * global WebSocket
 */

const { Observable } = require('rxjs/Rx');

type Compiler = {
  plugin: (name: string, fn: Function) => void,
};

type WebSocketProxy = {
  onConnection: (hanlder: Function) => void,
};

type WebSocket = {
  on: (event: string, Function) => void,
  send: (data: string) => void,
};

type Logger = {
  log: (...args: Array<mixed>) => void,
};

/**
 * Send updates on bundle rebuilds, so that HMR client can donwload update and process it.
 * In order to support `Enable Hot Reloading` button, we need to 2 connections:
 * - Native Hot Client (on path `/hot`) - if connected, we know that user enabled hot reloading,
 *   it's also used to send `update-start` and `update-done` messages, so it shows notification
 *   on client
 * - Haul HMR Client (on path `/haul-hmr`) - used to send stats to client, so it can download
 *   and process actuall update
 */
function hotMiddleware(
  compiler: Compiler,
  {
    nativeProxy,
    haulProxy,
  }: { nativeProxy: WebSocketProxy, haulProxy: WebSocketProxy },
  opts: { debug: boolean } = { debug: false }
) {
  const logger: Logger = {
    log(...args) {
      if (opts.debug) {
        console.log('[Hot middleware]', ...args);
      }
    },
  };

  const createLog = (...msgs) => {
    return () => logger.log(...msgs);
  };

  const compilerEvent$ = createCompilerEventStream(compiler);
  const nativeConnections$ = createConnectionStream(nativeProxy, 'native');
  const haulConnections$ = createConnectionStream(haulProxy, 'haul');

  compilerEvent$
    .withLatestFrom(
      nativeConnections$.do(createLog('Native client connected')),
      mergeCompilerEventWithConnection
    )
    .withLatestFrom(
      haulConnections$.do(createLog('Haul client connected')),
      mergeCompilerEventWithConnection
    )
    .map(event => ({ ...event, socket: event[event.target] }))
    .skipWhile(({ socket }) => socket.readyState !== socket.OPEN)
    .subscribe(
      event => {
        const { target, body } = event;
        const socket = event[target];

        logger.log(
          `Sending message ${body.action || body.type} to ${target} client`
        );

        socket.send(JSON.stringify(body), error => {
          if (error) {
            logger.log(
              `Sending message ${body.action ||
                body.type} to ${target} client failed`,
              error
            );
            socket.close();
          }
        });
      },
      error => {
        logger.log('Fatal error', error);
      }
    );
}

function createConnectionStream(wsProxy: WebSocketProxy, id: string) {
  return Observable.create((observer: *) => {
    wsProxy.onConnection((socket: WebSocket) => {
      observer.next({ id, socket });
    });
  });
}

function createCompilerEventStream(compiler: Compiler) {
  return Observable.create((observer: *) => {
    compiler.plugin('compile', () => {
      observer.next({ target: 'native', body: { type: 'update-start' } });
      observer.next({ target: 'haul', body: { action: 'building' } });
    });

    compiler.plugin('done', (stats: Object) => {
      observer.next({ target: 'native', body: { type: 'update-done' } });
      getStatsPayload(stats).forEach(payload => {
        observer.next({
          target: 'haul',
          body: { action: 'built', ...payload },
        });
      });
    });
  });
}

function mergeCompilerEventWithConnection(
  base: Object,
  connection: { id: string, socket: WebSocket }
) {
  return {
    ...base,
    [connection.id]: connection.socket,
  };
}

function getStatsPayload(stats: Object) {
  // For multi-compiler, stats will be an object with a 'children' array of stats
  const bundles = extractBundles(stats.toJson({ errorDetails: false }));
  return bundles.map(bundleStats => {
    return {
      name: bundleStats.name,
      time: bundleStats.time,
      hash: bundleStats.hash,
      warnings: bundleStats.warnings || [],
      errors: bundleStats.errors || [],
      modules: buildModuleMap(bundleStats.modules),
    };
  });
}

function extractBundles(stats: Object): Object[] {
  // Stats has modules, single bundle
  if (stats.modules) return [stats];

  // Stats has children, multiple bundles
  if (stats.children && stats.children.length) return stats.children;

  // Not sure, assume single
  return [stats];
}

function buildModuleMap(modules: Object[]): Object {
  const map = {};
  modules.forEach(module => {
    map[module.id] = module.name;
  });
  return map;
}

module.exports = hotMiddleware;
