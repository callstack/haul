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

/**
 * IMPORTANT: Do not add "use strict"
 * https://github.com/callstack/haul/issues/278
 * 
 * Some libraries like react-native-safe-module try to patch native modules to mock them
 * and prevent crashes, but don't account for the case when `requireNativeComponent` returns
 * a string. In strict mode, trying to modify properties of the string primitive throws an
 * error - "Cannot create property...". This breaks some modules like Lottie which use
 * react-native-safe-module
 */

function getPlatformFromURL(url) {
  let platform = (url.match(/platform=([a-zA-Z]*)/) || ['', undefined])[1];
  if (!platform) {
    // Try to get platform from bundle filename
    const [, filename] = /^https?:\/\/.+\/(.+)$/.exec(url) || [
      '',
      '',
    ];
    const segments = filename.split('.');
    if (segments.length > 2) {
      platform = segments[segments.length - 2];
    }
  }

  if (!platform) {
    throw new Error(`Cannot detect platform from URL: ${url}`);
  }

  return platform;
}

onmessage = (() => {
  let visibilityState;

  const messageQueue = [];
  let shouldQueueMessages = false;

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

  const processEnqueuedMessages = () => {
    while (messageQueue.length) {
      const messageProcess = messageQueue.shift();
      messageProcess();
    }
    shouldQueueMessages = false;
  };

  const messageHandlers = {
    executeApplicationScript(message, sendReply) {
      for (const key in message.inject) {
        self[key] = JSON.parse(message.inject[key]);
      }

      // Detect platform from initial bundle URL
      const platform = getPlatformFromURL(message.url);
      const loadedBundles = [];
      self.bundleRegistryLoad = (bundleName, sync) => {
        if (loadedBundles.includes(bundleName)) {
          return;
        }

        // TODO: add async variant support

        const url = `${self.location.origin}/${bundleName}.bundle?platform=${platform}`
        try {
          importScripts(url);
        } catch (error) {
          console.log(`Failed to evaluate additional bundle ${bundleName}`);
          throw error;
        }
      }

      shouldQueueMessages = true;

      try {
        importScripts(message.url)
      } catch (e) {
        if (self.ErrorUtils) {
          self.ErrorUtils.reportFatalError(e);
        } else {
          console.error(e);
        }
      } finally {
        self.postMessage({ replyID: message.id });
        processEnqueuedMessages();
      }
    },
    setDebuggerVisibility(message) {
      visibilityState = message.visibilityState;
    },
  };

  return (message) => {
    const processMessage = () => {
      if (visibilityState === 'hidden') {
        showVisibilityWarning();
      }

      const obj = message.data;
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
          returnValue = __fbBatchedBridge[obj.method].apply(
            null,
            obj.arguments
          );
        }
      } finally {
        sendReply(JSON.stringify(returnValue));
      }
    };

    if (shouldQueueMessages) {
      messageQueue.push(processMessage);
    } else {
      processMessage();
    }
  };
})();
