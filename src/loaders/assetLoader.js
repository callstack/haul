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

module.exports = async function assetLoader(content: Buffer) {
  this.cacheable();

  const callback = this.async();

  const query = utils.getOptions(this) || {};
  const options = this.options[query.config] || {};

  const config = Object.assign({}, options, query);

  const hash = utils.interpolateName(this, '[hash]', {
    context: config.context || this.options.context,
    content,
  });

  const filepath = this.resourcePath;
  const info = size(filepath);
  const dirname = path.dirname(filepath);
  const filename = path
    .basename(filepath, `.${info.type}`)
    .replace(/(@\\d+x)?$/, '');

  const regex = new RegExp(
    `^${escapeStringRegexp(filename)}(@\\d+x)?(\\.(${query.platform}|native))?\\.${info.type}`,
  );

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
        let [x, scale, y, platform] = match; // eslint-disable-line

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

  const scales = Object.keys(map).map(s => parseInt(s.replace(/^@/, ''), 10));

  const files = await Promise.all(
    Object.keys(map).map(scale => {
      this.addDependency(path.join(dirname, map[scale].name));

      return new Promise((resolve, reject) =>
        this.fs.readFile(path.join(dirname, map[scale].name), (err, res) => {
          if (err) {
            reject(err);
          } else {
            let name = `${filename}.${hash}${scale === '@1x' ? '' : scale}.${info.type}`;

            if (config.outputPath) {
              // support functions as outputPath to generate them dynamically
              name = typeof config.outputPath === 'function'
                ? config.outputPath(hash)
                : config.outputPath + hash;
            }

            this.emitFile(name, res);

            resolve(res);
          }
        }));
    }),
  );

  let outputPath = `${filename}.${hash}.${info.type}`;
  let publicPath = '__webpack_public_path__';

  if (config.outputPath) {
    // support functions as outputPath to generate them dynamically
    outputPath = typeof config.outputPath === 'function'
      ? config.outputPath(hash)
      : config.outputPath + hash;
  }

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(hash)
        : config.publicPath + hash,
    );
  }

  callback(
    null,
    `
    var AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      __packager_asset: true,
      fileSystemLocation: ${JSON.stringify(this.resourcePath)},
      httpServerLocation: ${publicPath},
      name: ${JSON.stringify(outputPath.replace(/\.[^.]+$/, ''))},
      width: ${info.width},
      height: ${info.height},
      type: ${JSON.stringify(info.type)},
      hash: ${JSON.stringify(`${hasha(Buffer.concat(files))}`)},
      scales: ${JSON.stringify(scales)},
    });
  `,
  );
};

module.exports.raw = true;
