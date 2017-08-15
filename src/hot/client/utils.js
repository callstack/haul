/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-expressions */

// $FlowFixMe
import { Platform } from 'react-native';

export default function resetRedBox() {
  if (Platform.OS === 'ios') {
    const RCTRedBox = require('NativeModules').RedBox;
    RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();
  } else {
    // $FlowFixMe
    const RCTExceptionsManager = require('NativeModules').ExceptionsManager;
    RCTExceptionsManager &&
      RCTExceptionsManager.dismissRedbox &&
      RCTExceptionsManager.dismissRedbox();
  }
}
