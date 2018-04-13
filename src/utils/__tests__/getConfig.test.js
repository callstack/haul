import path from 'path';
import { replacePathsInObject } from 'jest/helpers'; // eslint-disable-line import/no-unresolved
import getConfig from '../getConfig';

const cwd = process.cwd();

describe('zero config', () => {
  beforeEach(() => {
    // $FlowFixMe
    process.cwd = () => 'src/utils/__tests__/fixtures';
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

    expect(replacePathsInObject(iosConfig)).toMatchSnapshot('ios config');
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

    expect(replacePathsInObject(androidConfig)).toMatchSnapshot(
      'android config'
    );
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

  expect(replacePathsInObject(iosConfig)).toMatchSnapshot('ios config');
  expect(replacePathsInObject(androidConfig)).toMatchSnapshot('android config');
});
