/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 * global WebSocket
 */

const { Observable } = require('rxjs/Rx');
const Compiler = require('../../compiler/Compiler');

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
    .map(event => ({
      body: event.body,
      platform: event.platform,
      target: event.target,
      sockets: event[event.target].filter(
        socket =>
          socket.readyState === socket.OPEN &&
          (event.platform === 'all' ||
            socket.upgradeReq.url.includes(`platform=${event.platform}`))
      ),
    }))
    .skipWhile(({ sockets }) => !sockets.length)
    .subscribe(
      event => {
        const { target, sockets, body, platform } = event;

        sockets.forEach(socket => {
          logger.log(
            `Sending message '${body.action || body.type}'${
              body.hash ? `with hash '${body.hash}'` : ''
            } to ${target}:${platform} client`
          );

          socket.send(JSON.stringify(body), error => {
            if (error) {
              logger.log(
                `Sending message ${body.action ||
                  body.type} to ${target}:${platform} client failed`,
                error
              );
              socket.close();
            }
          });
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
      observer.next(socket);
    });
  })
    .scan((acc, socket) => [...acc, socket], [])
    .map(sockets => ({ [id]: sockets }));
}

function createCompilerEventStream(compiler: Compiler) {
  return Observable.create((observer: *) => {
    compiler.on(Compiler.Events.BUILD_START, () => {
      observer.next({
        target: 'native',
        platform: 'all',
        body: { type: 'update-start' },
      });
      observer.next({
        target: 'haul',
        platform: 'all',
        body: { action: 'building' },
      });
    });

    compiler.on(Compiler.Events.BUILD_FINISHED, ({ platform, stats }) => {
      observer.next({
        target: 'native',
        platform: 'all',
        body: { type: 'update-done' },
      });
      getStatsPayload(stats).forEach(payload => {
        observer.next({
          target: 'haul',
          platform: platform || 'all',
          body: { action: 'built', ...payload },
        });
      });
    });
  });
}

function mergeCompilerEventWithConnection(
  base: Object,
  connections: { [key: string]: WebSocket[] }
) {
  return {
    ...base,
    ...connections,
  };
}

function getStatsPayload(stats: Object) {
  // For multi-compiler, stats will be an object with a 'children' array of stats
  const bundles = extractBundles(stats);
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
