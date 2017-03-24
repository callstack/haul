const utils = require("loader-utils");
const size = require("image-size");
const path = require("path");

module.exports = function assetLoader(content) {
  if (this.cacheable) {
    this.cacheable();
  }

  const query = utils.getOptions(this) || {};
  const options = this.options[query.config] || {};

  const config = {
    publicPath: false,
    name: path.relative(process.cwd(), this.resourcePath)
  };

  // options takes precedence over config
  Object.assign(config, options);

  // query takes precedence over config and options
  Object.assign(config, query);

  const url = utils.interpolateName(this, config.name, {
    context: config.context || this.options.context,
    content
  });

  const info = size(this.resourcePath);

  let outputPath = url;
  let publicPath = `__webpack_public_path__ + ${JSON.stringify(path.join(path.dirname(url), path.basename(url, `.${info.type}`)))}`;

  if (config.outputPath) {
    // support functions as outputPath to generate them dynamically
    outputPath = typeof config.outputPath === "function"
      ? config.outputPath(url)
      : config.outputPath + url;
  }

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === "function"
        ? config.publicPath(url)
        : config.publicPath + url
    );
  }

  this.emitFile(outputPath, content);

  return `
  var AssetRegistry = require('AssetRegistry');
  module.exports = AssetRegistry.registerAsset({
    __packager_asset: true,
    httpServerLocation: '/',
    name: ${publicPath},
    width: ${info.width},
    height: ${info.height},
    type: '${info.type}',
    scales: [1],
  });
  `;
};

module.exports.raw = true;
