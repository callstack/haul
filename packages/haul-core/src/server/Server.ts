import { EnvOptions } from '../config/types';
import { Assign } from 'utility-types';
import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import Boom from '@hapi/boom';
// @ts-ignore
import Compiler from '@haul-bundler/core-legacy/build/compiler/Compiler';
import Runtime from '../runtime/Runtime';
import runAdbReverse from '../utils/runAdbReverse';
import createDeltaBundle from './createDeltaBundle';
import setupDevtoolRoutes from './setupDevtoolRoutes';

type ServerEnvOptions = Assign<
  Pick<EnvOptions, 'dev' | 'minify' | 'assetsDest' | 'root'>,
  { noInteractive: boolean; eager: string[] }
>;

export default class Server {
  compiler: any;

  constructor(
    private runtime: Runtime,
    private configPath: string,
    private options: ServerEnvOptions
  ) {}

  makeCompilerRoute(port: number): Hapi.ServerRoute {
    let hasRunAdbReverse = false;
    let hasWarnedDelta = false;

    const bundleRegex = /^([^.]+)(\.\w+)?\.(bundle|delta)$/;

    return {
      method: 'GET',
      path: '/{any*}',
      options: {
        validate: {
          query: {
            platform: Joi.string(),
            minify: Joi.boolean(),
            dev: Joi.boolean(),
          },
        },
      },
      handler: async (request, h) => {
        if (!bundleRegex.test(request.path)) {
          return new Promise(resolve => {
            const filename = request.path;
            this.compiler.emit(Compiler.Events.REQUEST_FILE, {
              filename,
              callback: (result: {
                file?: any;
                errors: string[];
                mimeType: string;
              }) => {
                resolve(
                  makeResponseFromCompilerResults(h, filename, '', result)
                );
              },
            });
          });
        } else {
          let [, bundleName, platform, bundleType] = bundleRegex.exec(
            request.path
          ) || ['', '', '', ''];
          if (platform) {
            platform = platform.slice(1);
          } else {
            platform = request.query.platform as string;
          }

          if (!hasRunAdbReverse && platform === 'android') {
            await runAdbReverse(this.runtime, port);
            hasRunAdbReverse = true;
          }

          if (bundleType === 'delta' && !hasWarnedDelta) {
            this.runtime.logger.warn(
              'Your app requested a delta bundle, this has minimal support in Haul'
            );
            hasWarnedDelta = true;
          }

          return new Promise(resolve => {
            const filename = `${bundleName}.${platform}.bundle`;
            this.compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
              filename,
              platform,
              callback: (result: {
                file?: any;
                errors: string[];
                mimeType: string;
              }) => {
                resolve(
                  makeResponseFromCompilerResults(
                    h,
                    filename,
                    bundleType,
                    result
                  )
                );
              },
            });
          });
        }
      },
    };
  }

  makeLiveReloadRoutes(): Hapi.ServerRoute[] {
    return [];
  }

  async listen(host: string, port: number) {
    this.compiler = new Compiler({
      configPath: this.configPath,
      configOptions: this.options,
    });

    const server = new Hapi.Server({
      port,
      host,
      router: {
        stripTrailingSlash: true,
      },
    });

    await server.register(require('@hapi/inert'));

    process.on('uncaughtException', async err => {
      this.runtime.logger.error(err);
      this.compiler.terminate();
      await server.stop();
      this.runtime.complete(1);
    });

    process.on('unhandledRejection', async err => {
      this.runtime.logger.error(err);
      this.compiler.terminate();
      await server.stop();
      this.runtime.complete(1);
    });

    process.on('SIGINT', async () => {
      this.compiler.terminate();
      await server.stop();
      this.runtime.complete(0);
    });

    process.on('SIGTERM', async () => {
      this.compiler.terminate();
      await server.stop();
      this.runtime.complete(2);
    });

    server.events.on(
      { name: 'request', channels: 'error' },
      (request, event) => {
        this.runtime.logger.error(
          `${this.runtime.logger.enhanceWithModifier(
            'bold',
            request.method.toUpperCase()
          )} ${request.path} failed: ${this.runtime.logger.enhanceWithColor(
            'red',
            event.tags
          )}`
        );
      }
    );

    server.events.on('response', request => {
      if (request.path !== '/status' && 'statusCode' in request.response) {
        const platform = request.query.platform
          ? this.runtime.logger.enhanceWithColor(
              'blue',
              `[${request.query.platform}]`
            )
          : '';

        const message = `${this.runtime.logger.enhanceWithModifier(
          'bold',
          request.method.toUpperCase()
        )} ${
          request.path
        } ${platform} - ${this.runtime.logger.enhanceWithModifier(
          'dim',
          request.response.statusCode
        )}`;

        if (request.response.statusCode < 300) {
          this.runtime.logger.done(message);
        } else if (request.response.statusCode < 400) {
          this.runtime.logger.warn(message);
        } else {
          this.runtime.logger.error(message);
        }
      }
    });

    // live reload
    // symbolicate
    // debugger worker
    server.route(this.makeLiveReloadRoutes());
    setupDevtoolRoutes(this.runtime, server, {
      isDebuggerConnected: () => true, // TODO: use debugger worker socket
    });
    server.route(this.makeCompilerRoute(port));

    await server.start();
    this.runtime.logger.done(`Packager server running on ${server.info.uri}`);

    this.options.eager.forEach(platform => {
      this.compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
        filename: `/index.${platform}.bundle`, // NOTE: maybe the entry bundle is arbitary
        platform,
        callback() {},
      });
    });
  }
}

function makeResponseFromCompilerResults(
  h: Hapi.ResponseToolkit,
  filename: string,
  bundleType: string,
  result: {
    file?: any;
    errors: string[];
    mimeType: string;
  }
) {
  if (result.errors) {
    return Boom.badImplementation(`File ${filename} not found`);
  } else if (!result.file) {
    return Boom.notFound(`File ${filename} not found`);
  }

  let file;
  if (bundleType === 'delta') {
    // We have a bundle, but RN is expecting a delta bundle.
    // Convert full bundle into the simplest delta possible.
    // This will load slower in RN, but it won't error, which is
    // nice for automated use-cases where changing the dev setting
    // is not possible.
    file = createDeltaBundle(result.file.toString());
  } else {
    file =
      result.file.type === 'Buffer'
        ? Buffer.from(result.file.data)
        : result.file;
  }

  return h
    .response(file.toString())
    .type(result.mimeType)
    .code(200);
}
