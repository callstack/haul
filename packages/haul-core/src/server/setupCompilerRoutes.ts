import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
// @ts-ignore
import Compiler from '@haul-bundler/core-legacy/build/compiler/Compiler';
import runAdbReverse from '../utils/runAdbReverse';
import createDeltaBundle from './createDeltaBundle';
import Runtime from '../runtime/Runtime';
import getBundleDataFromURL from '../utils/getBundleDataFromURL';

type Platform = string;
type BundleOptions = { dev: boolean; minify: boolean; alreadySet?: boolean };
type QueryBundleOptions = { dev?: boolean; minify?: boolean };
type PlatformsBundleOptions = {
  [platform in Platform]: BundleOptions;
};

export default function setupCompilerRoutes(
  runtime: Runtime,
  server: Hapi.Server,
  compiler: any,
  {
    port,
    bundleNames,
    platforms,
    cliBundleOptions,
  }: {
    port: number;
    bundleNames: string[];
    platforms: string[];
    cliBundleOptions: BundleOptions;
  }
) {
  let hasRunAdbReverse = false;
  let hasWarnedDelta = false;
  const bundleRegex = /^([^.]+)(\.[^.]+)?\.(bundle|delta)$/;
  let bundleOptions: PlatformsBundleOptions = platforms.reduce<
    PlatformsBundleOptions
  >((options, platform) => {
    options[platform] = { ...cliBundleOptions };
    return options;
  }, {});

  server.route({
    method: 'GET',
    path: '/{any*}',
    options: {
      validate: {
        query: Joi.object({
          platform: Joi.string(),
          minify: Joi.boolean(),
          dev: Joi.boolean(),
        }).unknown(true) as any,
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

        const bundleOptionsFromQuery = getBundleOptionsFromQuery(
          request.query,
          cliBundleOptions
        );
        const isUserChangedOptions = isUserChangedAlreadySetBundleOptions(
          bundleOptions[platform],
          bundleOptionsFromQuery
        );

        if (isUserChangedOptions) {
          const warnMsg =
            'Changing query params after the bundle has been created is not supported. To see the changes you need to restart the Haul server.';
          runtime.logger.warn(warnMsg);
          return h.response(warnMsg).code(501);
        }

        if (areBundleOptionsSet(bundleOptionsFromQuery)) {
          bundleOptions[platform] = {
            ...bundleOptions[platform],
            ...bundleOptionsFromQuery,
            alreadySet: true,
          };
        }

        const bundleOptionsForCompiler = {
          minify: bundleOptions[platform].minify,
          dev: bundleOptions[platform].dev,
        };

        return new Promise(resolve => {
          const filename = `${bundleName}.${platform}.bundle`;
          compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
            bundleOptions: bundleOptionsForCompiler,
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

function areBundleOptionsSet(bundleOptions: QueryBundleOptions) {
  return bundleOptions.dev !== undefined || bundleOptions.minify !== undefined;
}

function getBundleOptionsFromQuery(
  query: QueryBundleOptions,
  defaultOptions: BundleOptions
) {
  let bundleOptions: Partial<BundleOptions> = {};

  if (query.minify === true) {
    bundleOptions.minify = true;
  } else if (query.minify === false) {
    bundleOptions.minify = false;
  } else if (query.minify === undefined) {
    bundleOptions.minify = defaultOptions.minify;
  }

  if (query.dev === true) {
    bundleOptions.dev = true;
  } else if (query.dev === false) {
    bundleOptions.dev = false;
  } else if (query.dev === undefined) {
    bundleOptions.dev = defaultOptions.dev;
  }

  return bundleOptions;
}

function isUserChangedAlreadySetBundleOptions(
  bundleOptions: BundleOptions,
  bundleOptionsFromQuery: QueryBundleOptions
) {
  if (areBundleOptionsSet(bundleOptionsFromQuery)) {
    if (bundleOptions.alreadySet) {
      return (
        bundleOptions.dev !== bundleOptionsFromQuery.dev ||
        bundleOptionsFromQuery.minify !== bundleOptions.minify
      );
    }
  }
  return false;
}
