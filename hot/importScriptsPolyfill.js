/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

/**
 * When setting `target` to `webworker` in webpack config, it will change template for downloading
 * hot update and will use `importScripts` which are available in WebWorkers, so we need to
 * provide implementation for it.
 * 
 * Native `importScripts` is synchronous, however we can't do that, so this polyfill
 * is async and returns a Promise.
 */
global.importScripts =
  global.importScripts ||
  (importPath =>
    fetch(importPath)
      .then(response => response.text())
      .then(body => {
        // eslint-disable-next-line no-eval
        eval(body);
      }));
