/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-expressions */

// $FlowFixMe
import { Platform, NativeModules } from 'react-native';

export default function resetRedBox() {
  if (Platform.OS === 'ios') {
    const RCTRedBox = NativeModules.RedBox;
    RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();
  } else {
    const RCTExceptionsManager = NativeModules.ExceptionsManager;
    RCTExceptionsManager &&
      RCTExceptionsManager.dismissRedbox &&
      RCTExceptionsManager.dismissRedbox();
  }
}
