/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * This file is loaded as a part of user bundle
 *
 */
import { NativeModules } from 'react-native';

require('./importScriptsPolyfill');

if (process.env.NODE_ENV !== 'production') {
  let protocol;
  let origin;

  // If remote debugger is attached, we have access to `window` object
  // from which we may be able to  get `protocol` and `origin` of dev server.
  // This is a prefered way in remote debugger, otherwise it would
  // fail due to CSP errors because of making requests to eg `10.0.2.2`
  // from `localhost`.
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol !== 'file:'
  ) {
    protocol = window.location.protocol;
    origin = window.location.host;
  } else {
    // In order to ensure hot client has a valid URL we need to get a valid origin
    // from URL from which the bundle was loaded. When using iOS simulator/Android emulator
    // or Android device it will be `localhost:<port>` (Or whatever the user sets in
    // "Dev Settings" -> "Debug server host & port for device") but when using real iOS device
    // it will be `<ip>.xip.io:<port>`.
    const { scriptURL } = NativeModules.SourceCode;
    if (scriptURL) {
      [protocol, , origin] = scriptURL.split('/');
    }
  }

  if (protocol && origin) {
    global.DEV_SERVER_ORIGIN = `${protocol}//${origin}`;

    // Webpack's `publicPath` needs to be overwritten with `DEV_SERVER_ORIGIN` otherwise,
    // it would still make requests to (usually) `localhost`.
    __webpack_require__.p = `${global.DEV_SERVER_ORIGIN}/`; // eslint-disable-line no-undef
  }
}
