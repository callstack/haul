/* @flow */
import path from 'path';
import { replacePathsInObject, fixWorkers } from 'jest/helpers'; // eslint-disable-line import/no-unresolved
import snapshotDiff from 'snapshot-diff';
import getConfig from '../getConfig';

const cwd = process.cwd();

describe('zero config', () => {
  beforeEach(() => {
    // $FlowFixMe
    process.cwd = () => path.join(__dirname, './fixtures');
  });

  afterEach(() => {
    // $FlowFixMe
    process.cwd = () => cwd;
  });

  it('zero config - ios', () => {
    const iosConfig = getConfig(
      null,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
      },
      'ios'
    );

    expect(iosConfig).toMatchObject({
      mode: 'development',
      context: expect.any(String),
      entry: expect.any(Array),
      output: expect.objectContaining({
        path: expect.any(String),
        filename: 'index.ios.bundle',
        publicPath: expect.any(String),
      }),
      module: {
        rules: expect.any(Array),
      },
      plugins: expect.any(Array),
      optimization: expect.objectContaining({}),
      target: 'webworker',
      name: 'ios',
    });
  });

  it('zero config - android', () => {
    const androidConfig = getConfig(
      null,
      {
        dev: true,
        root: path.resolve(__dirname, 'fixtures'),
      },
      'android'
    );

    expect(androidConfig).toMatchObject({
      mode: 'development',
      context: expect.any(String),
      entry: expect.any(Array),
      output: expect.objectContaining({
        path: expect.any(String),
        filename: 'index.android.bundle',
        publicPath: expect.any(String),
      }),
      module: {
        rules: expect.any(Array),
      },
      plugins: expect.any(Array),
      optimization: expect.objectContaining({}),
      target: 'webworker',
      name: 'android',
    });
  });
});

it('creates config', () => {
  const configFilePath = path.resolve(__dirname, './fixtures/haul.config.js');

  const iosConfig = getConfig(
    configFilePath,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
    },
    'ios'
  );
  const androidConfig = getConfig(
    configFilePath,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
    },
    'android'
  );
  const configWithoutHMR = getConfig(
    configFilePath,
    {
      dev: true,
      root: path.resolve(__dirname, 'fixtures'),
      disableHotReloading: true,
    },
    'ios'
  );

  expect(replacePathsInObject(fixWorkers(iosConfig))).toMatchSnapshot(
    'ios config'
  );

  expect(
    snapshotDiff(
      replacePathsInObject(fixWorkers(iosConfig)),
      replacePathsInObject(fixWorkers(configWithoutHMR))
    )
  ).toMatchSnapshot('ios config with hot reloading disabled');

  expect(
    snapshotDiff(
      replacePathsInObject(fixWorkers(iosConfig)),
      replacePathsInObject(fixWorkers(androidConfig))
    )
  ).toMatchSnapshot('diff ios/android config');
});
