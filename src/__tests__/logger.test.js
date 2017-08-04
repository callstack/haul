/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import stripAnsi from 'strip-ansi';
import logger from '../logger';

beforeEach(() => {
  // $FlowFixMe
  console.log = jest.fn();
});
afterEach(() => jest.clearAllMocks());

test('section logs are always separated by one newline', () => {
  logger.info('single line');
  logger.info('multiple', 'entries');
  logger.info('single line with a newline\n');
  logger.info('test');
  const { calls } = console.log.mock;
  const logs = calls.map(call => call.join(' ')).join('\n');
  expect(stripAnsi(logs)).toMatchSnapshot();
});

test('debug logs are displayed without extra newlines', () => {
  logger.debug('pigeon', 'no space above');
  logger.debug('pigeon', 'no space above, but has newline\n');
  logger.debug('pigeon', 'space above');
  const { calls } = console.log.mock;
  const logs = calls.map(call => call.join(' ')).join('\n');
  expect(stripAnsi(logs)).toMatchSnapshot();
});
