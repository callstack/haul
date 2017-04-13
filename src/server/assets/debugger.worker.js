/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* global __fbBatchedBridge: true */
/* eslint-env worker */

'use strict';

self.onmessage = (() => {
  let visibilityState;
  const showVisibilityWarning = (() => {
    let hasWarned = false;
    return () => {
      // Wait until `YellowBox` gets initialized before displaying the warning.
      if (hasWarned || console.warn.toString().includes('[native code]')) {
        return;
      }
      hasWarned = true;
      const warning = 'Remote debugger is in a background tab which may cause apps to ' +
        'perform slowly. Fix this by foregrounding the tab (or opening it in ' +
        'a separate window).';
      console.warn(warning);
    };
  })();

  const messageHandlers = {
    executeApplicationScript({ inject, url }, sendReply) {
      for (const key in inject) {
        self[key] = JSON.parse(inject[key]);
      }
      let error;
      try {
        importScripts(url);
      } catch (err) {
        error = JSON.stringify(err);
      }
      sendReply(null /* result */, error);
    },
    setDebuggerVisibility(message) {
      visibilityState = message.visibilityState;
    },
  };

  return function({ data }) {
    if (visibilityState === 'hidden') {
      showVisibilityWarning();
    }

    const obj = data;

    const sendReply = (result, error) => {
      postMessage({ replyID: obj.id, result, error });
    };

    const handler = messageHandlers[obj.method];

    // Special cased handlers
    if (handler) {
      handler(obj, sendReply);
      return;
    }

    // Other methods get called on the bridge
    let returnValue = [[], [], [], 0];
    try {
      if (typeof __fbBatchedBridge === 'object') {
        returnValue = __fbBatchedBridge[obj.method].apply(null, obj.arguments);
      }
    } finally {
      sendReply(JSON.stringify(returnValue));
    }
  };
})();
