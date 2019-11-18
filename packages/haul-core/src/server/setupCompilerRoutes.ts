import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
// @ts-ignore
import Compiler from '@haul-bundler/core-legacy/build/compiler/Compiler';
import runAdbReverse from '../utils/runAdbReverse';
import createDeltaBundle from './createDeltaBundle';
import Runtime from '../runtime/Runtime';
import getBundleDataFromURL from '../utils/getBundleDataFromURL';

export default function setupCompilerRoutes(
  runtime: Runtime,
  server: Hapi.Server,
  compiler: any,
  {
    port,
    bundleNames,
    platforms,
  }: { port: number; bundleNames: string[]; platforms: string[] }
) {
  let hasRunAdbReverse = false;
  let hasWarnedDelta = false;
  const bundleRegex = /^([^.]+)(\.[^.]+)?\.(bundle|delta)$/;

  server.route({
    method: 'GET',
    path: '/{any*}',
    options: {
      validate: {
        query: Joi.object({
          platform: Joi.string(),
          minify: Joi.boolean(),
          dev: Joi.boolean(),
        }).unknown(true),
      },
    },
    handler: async (request, h) => {
      if (!bundleRegex.test(request.path)) {
        return new Promise(resolve => {
          const filename = request.path;
          compiler.emit(Compiler.Events.REQUEST_FILE, {
            filename,
            callback: (result: {
              file?: any;
              errors: string[];
              mimeType: string;
            }) => {
              resolve(makeResponseFromCompilerResults(h, { filename }, result));
            },
          });
        });
      } else {
        const {
          name: bundleName,
          platform,
          type: bundleType,
        } = getBundleDataFromURL(request.url.href);
        if (!platform) {
          const message = `Cannot detect platform parameter in URL: ${request.path}`;
          runtime.logger.error(message);
          return Boom.badImplementation(message);
        }

        if (!platforms.includes(platform)) {
          const message = `Platform "${platform}" is not supported - only: ${platforms
            .map(platform => `"${platform}"`)
            .join(', ')} are available.`;
          runtime.logger.error(message);
          return Boom.badRequest(message);
        }

        runtime.logger.info(
          `Compiling ${
            bundleType === 'bundle' ? bundleType : `${bundleType} bundle`
          } "${bundleName}" for platform ${platform}`
        );

        if (!hasRunAdbReverse && platform === 'android') {
          hasRunAdbReverse = true;
          await runAdbReverse(runtime, port);
        }

        if (bundleType === 'delta' && !hasWarnedDelta) {
          runtime.logger.warn(
            'Your app requested a delta bundle, this has minimal support in Haul'
          );
          hasWarnedDelta = true;
        }

        return new Promise(resolve => {
          const filename = `${bundleName}.${platform}.bundle`;
          compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
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
                  { filename, bundleType, bundleNames },
                  result
                )
              );
            },
          });
        });
      }
    },
  });
}

function makeResponseFromCompilerResults(
  h: Hapi.ResponseToolkit,
  {
    filename,
    bundleType,
    bundleNames,
  }: { filename: string; bundleType?: string; bundleNames?: string[] },
  result: {
    file?: any;
    errors: string[];
    mimeType: string;
  }
) {
  if (result.errors) {
    return h.response({ errors: result.errors }).code(500);
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

  const response = h
    .response(file)
    .type(result.mimeType)
    .code(200);

  // Add bundle names when running in multi-bundle mode.
  if (bundleNames && bundleNames.length > 1) {
    response.header(
      'X-multi-bundle',
      bundleNames.filter(name => !filename.includes(name)).join(',')
    );
  }

  return response;
}
