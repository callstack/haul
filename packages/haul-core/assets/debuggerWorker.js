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

class DebuggerWorker {
  constructor() {
    this.shouldQueueMessages = false;
    this.messageQueue = [];
    this.visibilityState = undefined;
    this.hasWarned = false;
    this.platform = undefined;
    this.initialUrl = undefined;

    self.bundleRegistryLoad = (...args) => this.bundleRegistryLoad(...args);
  }

  bundleRegistryOnLoad(bundleName) {
    if (typeof __fbBatchedBridge === 'object') {
      // Notify BundleRegistry that bundle was loaded. For some reason `__callFunction`
      // must be used instead of `callFunctionReturnFlushedQueue`. Otherwise the native side
      // would never receive event to update the UI, which would remain unchanged.
      __fbBatchedBridge.__callFunction(
        'BundleRegistry',
        'bundleRegistryOnLoad',
        [bundleName]
      );
    }
  }

  loadScript(bundleName, url) {
    try {
      importScripts(url);
      this.bundleRegistryOnLoad(bundleName);
    } catch (error) {
      console.error(`Failed to evaluate additional bundle: ${bundleName} (${url})`);
      throw error;
    }
  }

  bundleRegistryLoad(bundleName, sync) {
    if (self[bundleName]) {
      return;
    }

    if (!this.platform) {
      throw new Error(`Could not detect platform from URL: ${this.initialUrl}`);
    }

    const url = `${self.location.origin}/${bundleName}.bundle?platform=${this.platform}`;
    if (sync) {
      this.loadScript(bundleName, url);
    } else {
      // Fake async bundle loading, since it has no point when debugging and causes bugs.
      setTimeout(() => {
        this.loadScript(bundleName, url);
      }, 0);
    }
  };

  showVisibilityWarning() {
    // Wait until `YellowBox` gets initialized before displaying the warning.
    if (this.hasWarned || console.warn.toString().includes('[native code]')) {
      return;
    }
    this.hasWarned = true;
    const warning = 'Remote debugger is in a background tab which may cause apps to ' +
      'perform slowly. Fix this by foregrounding the tab (or opening it in ' +
      'a separate window).';
    console.warn(warning);
  }

  getPlatformFromURL(url) {
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
  
    return platform;
  }

  executeApplicationScript(message, sendReply) {
    for (const key in message.inject) {
      self[key] = JSON.parse(message.inject[key]);
    }

    // Detect platform from initial bundle URL
    if (!this.platform) {
      this.platform = this.getPlatformFromURL(message.url);
    }
    this.initialUrl = message.url;
    this.shouldQueueMessages = true;

    let error;
    const scriptURL = new URL(message.url);
    if (typeof self !== 'undefined' && self.location) {
      scriptURL.host = self.location.host;
    }
   
    try {
      importScripts(scriptURL.href);
    } catch (e) {
      error = e;
      if (self.ErrorUtils) {
        self.ErrorUtils.reportFatalError(e);
      } else {
        console.error(e);
      }
    } finally {
      sendReply(null, error);
      this.processEnqueuedMessages();
    }
  }

  setDebuggerVisibility({ visibilityState }) {
    this.visibilityState = visibilityState;
  }

  processMessage(message) {
    if (this.visibilityState === 'hidden') {
      this.showVisibilityWarning();
    }

    const { data } = message;
    const sendReply = (result, error) => {
      self.postMessage({ replyID: data.id, result, error });
    };
    const handler = this[data.method];

    // Special cased handlers
    if (handler) {
      handler.call(this, data, sendReply);
      return;
    }

    // Other methods get called on the bridge
    let returnValue = [[], [], [], 0];
    try {
      if (typeof __fbBatchedBridge === 'object') {
        returnValue = __fbBatchedBridge[data.method].apply(
          null,
          data.arguments
        );
      }
    } finally {
      sendReply(JSON.stringify(returnValue));
    }
  }

  processEnqueuedMessages() {
    while (this.messageQueue.length) {
      const message = this.messageQueue.shift();
      this.processMessage(message);
    }
    this.shouldQueueMessages = false;
  }

  handleMessage(message) {
    if (this.shouldQueueMessages) {
      this.messageQueue.push(message);
    } else {
      this.processMessage(message);
    }
  }
}

onmessage = (() => {
  const worker = new DebuggerWorker();
  return (message) => {
    worker.handleMessage(message);
  };
})();
