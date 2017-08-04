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
  logger.info('single line', 'with a newline\n');

  logger.warn('single line');
  logger.warn('multiple', 'entries');
  logger.warn('single line', 'with a newline\n');

  logger.error('single line');
  logger.error('multiple', 'entries');
  logger.error('single line', 'with a newline\n');

  logger.done('single line');
  logger.done('multiple', 'entries');
  logger.done('single line', 'with a newline\n');

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
