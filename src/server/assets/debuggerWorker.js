/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* global __fbBatchedBridge, self, importScripts, postMessage, onmessage: true */ // eslint-disable-line

/* eslint-disable */

'use strict';

onmessage = (function() {
  let visibilityState;
  const showVisibilityWarning = (function() {
    let hasWarned = false;
    return function() {
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
    executeApplicationScript(message, sendReply) {
      for (const key in message.inject) {
        self[key] = JSON.parse(message.inject[key]);
      }

      function evalJS(js) {
        try {
          eval(js);
        } catch (e) {
          self.ErrorUtils.reportFatalError(e);
        } finally {
          self.postMessage({ replyID: message.id });
        }
      }

      fetch(message.url).then(resp => resp.text()).then(evalJS);
    },
    setDebuggerVisibility(message) {
      visibilityState = message.visibilityState;
    },
  };

  return function(message) {
    if (visibilityState === 'hidden') {
      showVisibilityWarning();
    }

    const obj = message.data;

    const sendReply = function(result, error) {
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
