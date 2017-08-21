/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';

const _createElement = React.createElement;
const _createFactory = React.createFactory;

if (
  _createElement.isPatchedByReactHotLoader ||
  _createFactory.isPatchedByReactHotLoader
) {
  throw new Error(
    'React.createElement and createFactory did not got patched in correct order',
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
      typeof fileName !== 'string'
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
    // $FlowFixMe
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
