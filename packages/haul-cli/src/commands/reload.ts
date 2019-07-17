import { Arguments } from 'yargs';
import http from 'http';
import { Runtime, DEFAULT_PORT } from '@haul-bundler/core';

export default function reloadCommand(runtime: Runtime) {
  return {
    command: 'reload',
    describe: 'Sends reload request to all devices that enabled live reload',
    builder: {
      port: {
        description: 'Port your webpack server is running on',
        default: DEFAULT_PORT,
        type: 'number',
      },
    },
    async handler(
      argv: Arguments<{
        port: number;
      }>
    ) {
      let exitCode = 0;
      try {
        const requestOptions = {
          hostname: 'localhost',
          port: argv.port,
          path: '/reloadapp',
          method: 'HEAD',
        };

        await new Promise(resolve => {
          const req = http.request(requestOptions, () => {
            runtime.logger.done('Sent reload request');
            resolve();
          });

          req.on('error', e => {
            const error = e.toString();
            if (error.includes('connect ECONNREFUSED')) {
              runtime.logger.error(
                `Reload request failed. Make sure Haul is up.`
              );
            } else {
              runtime.logger.error(e);
            }
            resolve();
          });

          req.end();
        });
      } catch (error) {
        runtime.logger.error('Command failed with error:', error);
        exitCode = 1;
      } finally {
        runtime.complete(exitCode);
      }
    },
  };
}
