/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const escapeStringRegexp = require('escape-string-regexp');
const logger = require('../logger');

const isVerbose = process.argv.includes('--verbose');

type Request = {
  path: string,
};

type Options = {
  test?: RegExp,
  platform: string,
};

type CollectOutput = {
  [key: string]: {
    platform: 'ios' | 'android',
    name: string,
  },
};

type CollectOptions = {
  name: string,
  platform: string,
  type: string,
};

function AssetResolver(options: Options) {
  const platform = options.platform;
  const test = options.test || AssetResolver.test;

  this.apply = function apply(resolver) {
    resolver.plugin('file', (request: Request, callback: Function) => {
      if (!test.test(request.path)) {
        callback();
        return;
      }

      resolver.fileSystem.readdir(
        path.dirname(request.path),
        (error, result) => {
          if (error) {
            callback();
            return;
          }

          const name = path.basename(request.path).replace(/\.[^.]+$/, '');
          const type = request.path.split('.').pop();

          let resolved = result.includes(path.basename(request.path))
            ? request.path
            : null;

          if (!resolved) {
            const map = AssetResolver.collect(result, {
              name,
              type,
              platform,
            });
            const key = map['@1x']
              ? '@1x'
              : Object.keys(map).sort(
                  (a, b) =>
                    Number(a.replace(/[^\d.]/g, '')) -
                    Number(b.replace(/[^\d.]/g, ''))
                )[0];

            resolved =
              map[key] && map[key].name
                ? path.resolve(path.dirname(request.path), map[key].name)
                : null;
          }

          if (!resolved) {
            if (isVerbose) {
              logger.warn(`Cannot resolve: ${request.path}`);
            }
            callback();
            return;
          }

          const resolvedFile = Object.assign({}, request, {
            path: resolved,
            relativePath:
              request.relativePath &&
              resolver.join(request.relativePath, resolved),
            file: true,
          });

          if (isVerbose) {
            logger.info(`${request.path} <--> ${resolvedFile.path}`);
          }

          callback(null, resolvedFile);
        }
      );
    });
  };
}

AssetResolver.test = /\.(aac|aiff|bmp|caf|gif|html|jpeg|jpg|m4a|m4v|mov|mp3|mp4|mpeg|mpg|obj|otf|pdf|png|psd|svg|ttf|wav|webm|webp)$/;
AssetResolver.collect = (
  list: Array<string>,
  { name, type, platform }: CollectOptions
): CollectOutput => {
  const regex = /^(bmp|gif|jpg|jpeg|png|psd|tiff|webp|svg)$/.test(type)
    ? new RegExp(
        `^${escapeStringRegexp(
          name
        )}(@\\d+(\\.\\d+)?x)?(\\.(${platform}|native))?\\.${type}$`
      )
    : new RegExp(
        `^${escapeStringRegexp(name)}(\\.(${platform}|native))?\\.${type}$`
      );
  const priority = queryPlatform =>
    [undefined, 'native', platform].indexOf(queryPlatform);

  // Build a map of files according to the scale
  return list.reduce((acc, curr) => {
    const match = regex.exec(curr);

    if (match) {
      let [x, scale, y, z, platform] = match // eslint-disable-line

      scale = scale || '@1x';

      if (acc[scale] && priority(platform) < priority(acc[scale].platform)) {
        // do nothing
        return acc;
      }

      return Object.assign({}, acc, {
        [scale]: { platform, name: curr },
      });
    }

    return acc;
  }, {});
};

module.exports = AssetResolver;
