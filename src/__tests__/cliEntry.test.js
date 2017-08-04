/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import stripAnsi from 'strip-ansi';
import inquirer from 'inquirer';
import { flushPromises } from 'jest/helpers';
import run from '../cliEntry';
import init from '../commands/init';
import bundle from '../commands/bundle';

jest.mock('inquirer', () => {
  // $FlowFixMe
  const acutual = require.requireActual('inquirer');
  return {
    ...acutual,
    prompt: jest.fn(() => Promise.resolve({ answer: 'ios' })),
  };
});

jest.mock('../commands/init', () => {
  // $FlowFixMe
  const actual = require.requireActual('../commands/init');
  return {
    ...actual,
    action: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../commands/bundle', () => {
  // $FlowFixMe
  const actual = require.requireActual('../commands/bundle');
  return {
    ...actual,
    action: jest.fn(() => Promise.resolve()),
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

test('run a command with options (bundle)', async () => {
  run(['bundle']);
  await flushPromises();
  expect(inquirer.prompt).toBeCalledWith([
    {
      choices: expect.arrayContaining([
        { name: expect.any(String), short: expect.any(String), value: 'ios' },
      ]),
      message: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
    },
  ]);
  expect(bundle.action).toBeCalledWith(
    expect.objectContaining({ platform: 'ios' }),
  );
});
