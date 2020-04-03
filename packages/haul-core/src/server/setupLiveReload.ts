import Hapi, { Request } from '@hapi/hapi';
import Runtime from '../runtime/Runtime';
// @ts-ignore
import Compiler from '@haul-bundler/core-legacy/build/compiler/Compiler';

export default function setupLiveReload(
  runtime: Runtime,
  server: Hapi.Server,
  compiler: any
) {
  let watchers: Array<Request['raw'] & { notified: boolean }> = [];
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
  };

  function notifyAllWatchers() {
    watchers.forEach(watcher => {
      watcher.notified = true;
      watcher.res.writeHead(205, headers);
      watcher.res.end(JSON.stringify({ changed: true }));
    });

    watchers = [];
  }

  compiler.on(Compiler.Events.BUILD_FINISHED, () => {
    notifyAllWatchers();
  });

  server.route({
    method: 'GET',
    path: '/onchange',
    handler: request =>
      new Promise(resolve => {
        /**
         * React Native client opens connection at `/onchange`
         * and awaits reload signal (http status code - 205)
         */
        const watcher = Object.assign(request.raw, { notified: false });
        watchers.push(watcher);
        watcher.req.on('close', () => {
          watchers.splice(watchers.indexOf(watcher), 1);
          if (!watcher.notified) {
            resolve('OK');
          }
        });
      }),
  });

  server.route({
    method: 'GET',
    path: '/reloadapp',
    handler: () => {
      runtime.logger.info(
        'Attempt to reload the app, make sure you have enabled Live Reloading!'
      );
      notifyAllWatchers();
      return 'OK';
    },
  });
}
