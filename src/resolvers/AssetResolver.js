/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const escapeStringRegexp = require('escape-string-regexp');

type Request = {
  path: string,
};

type Options = {
  test?: RegExp,
  platform: 'ios' | 'android',
};

function AssetResolver(options: Options) {
  const platform = options.platform;
  const test = options.test || AssetResolver.test;

  this.apply = function apply(resolver) {
    resolver.plugin('file', (request: Request, callback: Function) => {
      if (test.test(request.path)) {
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
                      Number(b.replace(/[^\d.]/g, '')),
                  )[0];
              resolved =
                map[key] && map[key].name
                  ? path.resolve(path.dirname(request.path), map[key].name)
                  : null;
            }

            if (resolved) {
              callback(
                null,
                Object.assign({}, request, {
                  path: resolved,
                  relativePath:
                    request.relativePath &&
                    resolver.join(request.relativePath, resolved),
                  file: true,
                }),
              );
            } else {
              callback();
            }
          },
        );
      } else {
        callback();
      }
    });
  };
}

AssetResolver.test = /\.(bmp|gif|jpg|jpeg|png|psd|svg|webp|m4v|aac|aiff|caf|m4a|mp3|wav|html|pdf)$/;
AssetResolver.collect = (
  list,
  { name, type, platform }: { name: string, type: string, platform: string },
) => {
  const regex = /^(bmp|gif|jpg|jpeg|png|psd|tiff|webp|svg)$/.test(type)
    ? new RegExp(
        `^${escapeStringRegexp(
          name,
        )}(@\\d+(\\.\\d+)?x)?(\\.(${platform}|native))?\\.${type}$`,
      )
    : new RegExp(
        `^${escapeStringRegexp(name)}(\\.(${platform}|native))?\\.${type}$`,
      );

  // Build a map of files according to the scale
  return list.reduce((acc, curr) => {
    const match = regex.exec(curr);

    if (match) {
      let [x, scale, y, z, platform] = match; // eslint-disable-line

      scale = scale || '@1x';

      if (acc[scale]) {
        // platform takes highest prio, so if it exists, don't do anything
        if (acc[scale].platform === platform) {
          return acc;
        }

        // native takes second prio, so if it exists and platform doesn't, don't do anything
        if (acc[scale].platform === 'native' && !platform) {
          return acc;
        }
      }

      return Object.assign({}, acc, {
        [scale]: { platform, name: curr },
      });
    }

    return acc;
  }, {});
};

module.exports = AssetResolver;
