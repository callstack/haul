/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/* eslint-env jest */
const findProvidesModule = require('../findProvidesModule');
const path = require('path');

describe('findProvidesModule', () => {
  it('should return a map with haste modules', () => {
    const dir = path.join(__dirname, '../../../node_modules/react-native');
    expect(findProvidesModule([dir])).toBeInstanceOf(Object);
  });
});
