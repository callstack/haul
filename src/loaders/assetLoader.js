/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const utils = require('loader-utils');
const size = require('image-size');
const path = require('path');
const hasha = require('hasha');
const escapeStringRegexp = require('escape-string-regexp');

module.exports = async function assetLoader() {
  this.cacheable();

  const callback = this.async();

  const query = utils.getOptions(this) || {};
  const options = this.options[query.config] || {};
  const config = Object.assign({}, options, query);

  const filepath = this.resourcePath;
  const info = size(filepath);
  const dirname = path.dirname(filepath);
  const suffix = `(@\\d+(\\.\\d+)?x)?(\\.(${query.platform}|native))?\\.${info.type}$`;
  const filename = path.basename(filepath).replace(new RegExp(suffix), '');

  // When building for `all` platforms in dev mode (query.bundle == false)
  // we need to make assets platform-specific, otherwise they overwrite
  // each other
  const url = path.relative(
    query.root,
    path.join(dirname, query.bundle ? '' : query.platform),
  );

  const regex = new RegExp(`^${escapeStringRegexp(filename)}${suffix}`);

  const result = await new Promise((resolve, reject) =>
    this.fs.readdir(dirname, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }));

  const map = result.reduce(
    (acc, name) => {
      const match = name.match(regex);

      if (match) {
        let [x, scale, y, z, platform] = match; // eslint-disable-line

        scale = scale || '@1x';

        if (acc[scale]) {
          // platform takes highest prio, so if it exists, don't do anything
          if (acc[scale].platform === query.platform) {
            return acc;
          }

          // native takes second prio, so if it exists and platform doesn't, don't do anything
          if (acc[scale].platform === 'native' && !platform) {
            return acc;
          }
        }

        return Object.assign({}, acc, {
          [scale]: { platform, name },
        });
      }

      return acc;
    },
    {},
  );

  const scales = Object.keys(map)
    .map(s => Number(s.replace(/[^\d.]/g, '')))
    .sort();

  const buffers = await Promise.all(
    Object.keys(map).map(scale => {
      this.addDependency(path.join(dirname, map[scale].name));

      return new Promise((resolve, reject) =>
        this.fs.readFile(path.join(dirname, map[scale].name), (err, res) => {
          if (err) {
            reject(err);
          } else {
            let dest;

            if (query.bundle && query.platform === 'android') {
              switch (scale) {
                case '@0.75x':
                  dest = 'drawable-ldpi';
                  break;
                case '@1x':
                  dest = 'drawable-mdpi';
                  break;
                case '@1.5x':
                  dest = 'drawable-hdpi';
                  break;
                case '@2x':
                  dest = 'drawable-xhdpi';
                  break;
                case '@3x':
                  dest = 'drawable-xxhdpi';
                  break;
                case '@4x':
                  dest = 'drawable-xxxhdpi';
                  break;
                default:
                  throw new Error(`Unknown scale ${scale} for ${filepath}`);
              }

              const longname = `${`${url.replace(/\//g, '_')}_${filename}`
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '')}.${info.type}`;

              dest = path.join(dest, longname);
            } else {
              const name = `${filename}${scale === '@1x' ? '' : scale}.${info.type}`;
              dest = path.join(url, name);
            }

            // support functions as outputPath to generate them dynamically
            dest = typeof config.outputPath === 'function'
              ? config.outputPath(dest)
              : path.join(config.outputPath || '', dest);

            this.emitFile(dest, res);

            resolve(res);
          }
        }));
    }),
  );

  const publicPath = JSON.stringify(
    // support functions as publicPath to generate them dynamically
    typeof config.publicPath === 'function'
      ? config.publicPath(url)
      : path.join(config.publicPath || '', url),
  );

  callback(
    null,
    `
    var AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      __packager_asset: true,
      fileSystemLocation: ${JSON.stringify(query.bundle ? null : path.dirname(this.resourcePath))},
      httpServerLocation: ${publicPath},
      name: ${JSON.stringify(filename)},
      width: ${info.width},
      height: ${info.height},
      type: ${JSON.stringify(info.type)},
      hash: ${JSON.stringify(hasha(Buffer.concat(buffers)))},
      scales: ${JSON.stringify(scales)},
    });
  `,
  );
};

module.exports.raw = true;
