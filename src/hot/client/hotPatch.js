/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

// eslint-disable-next-line
import React from 'react';

const _createElement = React.createElement;
const _createFactory = React.createFactory;

if (
  _createElement.isPatchedByReactHotLoader ||
  _createFactory.isPatchedByReactHotLoader
) {
  throw new Error(
    'React.createElement and createFactory did not got patched in correct order'
  );
}

require('react-hot-loader/patch');

if (typeof global.__REACT_HOT_LOADER__ !== 'undefined') {
  const patchedCreateElement = React.createElement;
  const patchedCreateFactory = React.createFactory;
  const registerHook = global.__REACT_HOT_LOADER__.register;
  const resetHook = global.__REACT_HOT_LOADER__.reset;

  const idsByType = new Map();

  global.__REACT_HOT_LOADER__.register = (type, uniqueLocalName, fileName) => {
    if (
      typeof type !== 'function' ||
      typeof uniqueLocalName !== 'string' ||
      typeof fileName !== 'string' ||
      /**
       * In case where someone extract function from a prototype 
       * example: `const hasOwnProperty = Object.prototype.hasOwnProperty`,
       * then hasOwnProperty is being patched by HMR
       * Here: https://github.com/gaearon/react-hot-loader/blob/master/src/patch.dev.js#L14-L20
       * When we get to point where we retrives keys from patched functions
       * here: https://github.com/gaearon/react-hot-loader/blob/master/src/patch.dev.js#L43
       * We'll be actually looping over `hasOwnPrototype`'s arities, which are `undefined`
       * Accessing properties on `undefined` will throw an error
       */
      Object.prototype[uniqueLocalName]
    ) {
      return;
    }

    idsByType.set(type, `${fileName}#${uniqueLocalName}`);
    registerHook(type, uniqueLocalName, fileName);
  };

  global.__REACT_HOT_LOADER__.reset = (...args) => {
    idsByType.clear();
    resetHook(...args);
  };

  // $FlowFixMe
  React.createElement = (type, ...args) => {
    const id = idsByType.get(type);
    const fn =
      typeof id === 'string' && /react-native/.test(id)
        ? _createElement
        : patchedCreateElement;
    return fn(type, ...args);
  };

  // $FlowFixMe
  React.createFactory = type => {
    const id = idsByType.get(type);
    const fn =
      typeof id === 'string' && /react-native/.test(id)
        ? _createFactory
        : patchedCreateFactory;
    return fn(type);
  };
} else {
  throw new Error('react-hot-loader/patch did not run in correct order');
}
