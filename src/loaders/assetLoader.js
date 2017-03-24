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

  const config = Object.assign(
    {
      publicPath: false,
      name: '[name].[hash]'
    },
    options,
    query
  );

  const url = utils.interpolateName(this, config.name, {
    context: config.context || this.options.context,
    content
  });

  const filepath = this.resourcePath;
  const info = size(filepath);
  const dirname = path.dirname(filepath);
  const filename = path.basename(filepath, `.${info.type}`);

  const result = await new Promise((resolve, reject) =>
    this.fs.readdir(dirname, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }));

  const scales = [1];
  const regex = new RegExp('^' + escapeStringRegexp(filename) + '@(\\d+)x\\.' + info.type);

  let files = await Promise.all(
    result.map(name => {
      const match = name.match(regex);

      if (match) {
        scales.push(parseInt(match[1], 10));
        this.addDependency(path.join(dirname, name));

        return new Promise((resolve, reject) =>
          this.fs.readFile(path.join(dirname, name), (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }));
      }

      return Promise.resolve();
    })
  );

  files = files.filter(f => f);
  files.unshift(content);

  let outputPath = url;
  let publicPath = `__webpack_public_path__`;

  if (config.outputPath) {
    // support functions as outputPath to generate them dynamically
    outputPath = typeof config.outputPath === 'function'
      ? config.outputPath(url)
      : config.outputPath + url;
  }

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(url)
        : config.publicPath + url
    );
  }

  this.emitFile(outputPath, content);

  files.forEach((file, i) => {
    let name = `${url}@${scales[i]}x.${info.type}`;

    if (config.outputPath) {
      // support functions as outputPath to generate them dynamically
      name = typeof config.outputPath === 'function'
        ? config.outputPath(url)
        : config.outputPath + url;
    }

    this.emitFile(name, file);
  });

  callback(
    null,
    `
    var AssetRegistry = require('AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      __packager_asset: true,
      fileSystemLocation: ${JSON.stringify(this.resourcePath)},
      httpServerLocation: ${publicPath},
      name: ${JSON.stringify(outputPath)},
      width: ${info.width},
      height: ${info.height},
      type: ${JSON.stringify(info.type)},
      hash: ${JSON.stringify(hasha(Buffer.concat(files)) + '3')},
      scales: ${JSON.stringify(scales)},
    });
  `
  );
};

module.exports.raw = true;
