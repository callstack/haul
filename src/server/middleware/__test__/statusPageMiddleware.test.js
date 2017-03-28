/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * statusPageMiddleware.test.js
 *
 * @flow
 */
const statusPageMiddleware = require('../statusPageMiddleware');

describe('status page middleware', () => {
  it('should respond with status:running', () => {
    const url: string = '/status';
    const end: Function = jest.fn();
    const next: Function = jest.fn();
    statusPageMiddleware({ url }, { end }, next);
    expect(end).toHaveBeenCalledWith('packager-status:running');
    expect(next).not.toHaveBeenCalled();
  });

  it('should skip to next', () => {
    const url: string = '/';
    const end: Function = jest.fn();
    const next: Function = jest.fn();
    statusPageMiddleware({ url }, { end }, next);
    expect(end).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
