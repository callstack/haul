/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');

type Request = {
  path: string,
};

type Options = {
  test?: RegExp,
  platform: 'ios' | 'android',
};

function AssetResolver(options: Options) {
  const test = options.test || AssetResolver.test;
  const platform = options.platform;

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

            const name = request.path.replace(/\.[^.]+$/, '');
            const ext = request.path.split('.').pop();
            const files = [
              `${name}@1x.${platform}.${ext}`,
              `${name}.${platform}.${ext}`,
              `${name}@1x.native.${ext}`,
              `${name}.native.${ext}`,
              `${name}@1x.${ext}`,
              request.path,
            ];

            for (const file of files) {
              if (result.includes(path.basename(file))) {
                callback(
                  null,
                  Object.assign({}, request, {
                    path: file,
                    relativePath: request.relativePath &&
                      resolver.join(request.relativePath, file),
                    file: true,
                  }),
                );
                return;
              }
            }

            callback();
          },
        );
      } else {
        callback();
      }
    });
  };
}

AssetResolver.test = /\.(bmp|gif|jpg|jpeg|png)$/;

module.exports = AssetResolver;
