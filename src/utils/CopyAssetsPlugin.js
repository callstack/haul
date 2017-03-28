/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
class CopyAssetsPlugin {
  constructor({ destination }) {
    console.log(destination);
  }

  apply(compiler) {
    compiler.plugin('after-emit', (compilation, next) => {
      console.log(compilation);
      next();
    });
  }
}

module.exports = CopyAssetsPlugin;
