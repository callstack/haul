/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

type Request = {
  path: string,
};

type Options = {
  test?: RegExp,
  platform: 'ios' | 'android',
};

const exists = (fs, file) =>
  new Promise(resolve => {
    fs.stat(file, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

function AssetResolver(options: Options) {
  const test = options.test || AssetResolver.test;
  const platform = options.platform;

  return function resolver() {
    this.plugin('file', async (request: Request, callback: Function) => {
      if (test.test(request.path)) {
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
          /* eslint-disable no-await-in-loop */
          const result = await exists(this.fileSystem, file);

          if (result) {
            callback(
              null,
              Object.assign({}, request, {
                path: file,
                relativePath: request.relativePath &&
                  this.join(request.relativePath, file),
                file: true,
              }),
            );
            return;
          }
        }
      }

      callback();
    });
  };
}

AssetResolver.test = /\.(bmp|gif|jpg|jpeg|png)$/;

module.exports = AssetResolver;
