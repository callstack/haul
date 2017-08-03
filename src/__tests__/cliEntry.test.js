/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import stripAnsi from 'strip-ansi';
import { flushPromises } from 'jest/helpers';
import run from '../cliEntry';
import init from '../commands/init';

jest.mock('../commands/init', () => {
  return {
    name: 'init',
    description: 'Generates necessary configuration files',
    action: jest.fn(),
  };
});

const originalConsoleLog = console.log;

beforeEach(() => {
  // $FlowFixMe
  console.log = jest.fn();
});

afterEach(() => {
  // $FlowFixMe
  console.log = originalConsoleLog;
  jest.clearAllMocks();
});

test('display help', () => {
  run(['help']);
  run(['--help']);
  const { calls } = console.log.mock;
  expect(calls[0][0]).toEqual(calls[1][0]);
  expect(stripAnsi(calls[0][0])).toMatchSnapshot();
});

test('display unsupported command info (run-ios)', () => {
  run(['run-ios']);
  const { calls } = console.log.mock;
  const message = calls[1].join(' ');
  expect(stripAnsi(message)).toMatchSnapshot();
});

test('display command help (start)', () => {
  run(['start', '--help']);
  const { calls } = console.log.mock;
  expect(stripAnsi(calls[0][0])).toMatchSnapshot();
});

test('run a command without options (init)', async () => {
  run(['init']);
  await flushPromises();
  expect(init.action).toBeCalledWith({});
});
