/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Array.prototype.es6
 * @polyfill
 * @nolint
 */

/* eslint-disable no-bitwise, no-extend-native, radix, no-self-compare */

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
function findIndex(predicate, context) {
  if (this == null) {
    throw new TypeError(
      'Array.prototype.findIndex called on null or undefined'
    );
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }
  const list = Object(this);
  const length = list.length >>> 0;
  for (let i = 0; i < length; i++) {
    if (predicate.call(context, list[i], i, list)) {
      return i;
    }
  }
  return -1;
}

if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: findIndex,
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    enumerable: false,
    writable: true,
    configurable: true,
    value(predicate, context) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      const index = findIndex.call(this, predicate, context);
      return index === -1 ? undefined : this[index];
    },
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    enumerable: false,
    writable: true,
    configurable: true,
    value(searchElement) {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      const n = parseInt(arguments[1]) || 0;
      let k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {
          k = 0;
        }
      }
      let currentElement;
      while (k < len) {
        currentElement = O[k];
        if (
          searchElement === currentElement ||
          (searchElement !== searchElement && currentElement !== currentElement)
        ) {
          return true;
        }
        k++;
      }
      return false;
    },
  });
}
