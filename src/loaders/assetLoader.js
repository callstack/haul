/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const utils = require('loader-utils');
const size = require('image-size');
const path = require('path');
const dedent = require('dedent');
const hasha = require('hasha');
const escapeStringRegexp = require('escape-string-regexp');
const AssetResolver = require('../resolvers/AssetResolver');

type Config = {
  platform: string,
  bundle?: boolean,
  root: string,
  outputPath?: string | ((path: string) => string),
  publicPath?: string | ((path: string) => string),
};

module.exports = async function assetLoader() {
  this.cacheable();

  const callback = this.async();

  const query = utils.getOptions(this) || {};
  const options = this.options[query.config] || {};
  const config: Config = Object.assign({}, options, query);

  const pathSepPattern = new RegExp(`\\${path.sep}`, 'g');
  const filepath = this.resourcePath;
  const dirname = path.dirname(filepath);
  const url = path.relative(config.root, dirname);
  const type = path.extname(filepath).replace(/^\./, '');
  const assets = path.join('assets', config.bundle ? '' : config.platform);
  const suffix = `(@\\d+(\\.\\d+)?x)?(\\.(${config.platform}|native))?\\.${type}$`;
  const filename = path.basename(filepath).replace(new RegExp(suffix), '');
  const longname = `${`${url.replace(pathSepPattern, '_')}_${filename}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')}.${type}`;

  const result = await new Promise((resolve, reject) =>
    this.fs.readdir(dirname, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }),
  );

  const map = AssetResolver.collect(result, {
    name: filename,
    type,
    platform: config.platform,
  });

  const scales = Object.keys(map)
    .map(s => Number(s.replace(/[^\d.]/g, '')))
    .sort();

  const pairs = await Promise.all(
    Object.keys(map).map(scale => {
      this.addDependency(path.join(dirname, map[scale].name));

      return new Promise((resolve, reject) =>
        this.fs.readFile(path.join(dirname, map[scale].name), (err, res) => {
          if (err) {
            reject(err);
          } else {
            let dest;

            if (config.bundle && config.platform === 'android') {
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

              dest = path.join(dest, longname);
            } else {
              const name = `${filename}${scale === '@1x' ? '' : scale}.${type}`;
              dest = path.join(assets, url, name);
            }

            resolve({
              destination: dest,
              content: res,
            });
          }
        }),
      );
    }),
  );

  pairs.forEach(item => {
    let dest = item.destination;

    if (config.outputPath) {
      // support functions as outputPath to generate them dynamically
      dest =
        typeof config.outputPath === 'function'
          ? config.outputPath(dest)
          : path.join(config.outputPath, dest);
    }

    this.emitFile(dest, item.content);
  });

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(
    path.join('/', assets, url).replace(pathSepPattern, '/'),
  )}`;

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(url)
        : path.join(config.publicPath, url),
    );
  }

  const hashes = pairs.map(item => hasha(item.content, { algorithm: 'md5' }));

  let info: ?{ width: number, height: number, type: string };

  try {
    info = size(this.resourcePath);

    const match = path
      .basename(this.resourcePath)
      .match(new RegExp(`^${escapeStringRegexp(filename)}${suffix}`));

    if (match && match[1]) {
      const scale = Number(match[1].replace(/[^\d.]/g, ''));

      if (typeof scale === 'number' && Number.isFinite(scale)) {
        info.width /= scale;
        info.height /= scale;
      }
    }
  } catch (e) {
    // Asset is not an image
  }

  callback(
    null,
    dedent`
    var AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      __packager_asset: true,
      scales: ${JSON.stringify(scales)},
      name: ${JSON.stringify(filename)},
      type: ${JSON.stringify(type)},
      hash: ${JSON.stringify(hashes.join())},
      httpServerLocation: ${publicPath},
      ${config.bundle ? '' : `fileSystemLocation: ${JSON.stringify(dirname)},`}
      ${info ? `height: ${info.height},` : ''}
      ${info ? `width: ${info.width},` : ''}
    });
    `,
  );
};

module.exports.raw = true;
