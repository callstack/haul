import stripDeadPlatformSelect from '../stripDeadPlatformSelect';
import { transformSync } from '@babel/core';

const fixture1 = `
const value = Platform.select({
  android: 'android',
  ios: () => {},
  default: { test: true },
  web: 'what?'
});
`;

const fixture2 = `
const defaults = { default: 'default' };
const value = Platform.select({
  ios: () => {},
  ...defaults,
});
`;

const fixture3 = `
const value = Platform.select({
  android: () => {},
});
`;

const fixture4 = `
const value = Platform.select({
  ios: false,
  ['andr' + 'oid']: () => {},
});
`;

const fixture5 = `
const value = Platform.select({
  default: 'default',
  ['andr' + 'oid']() {}
});
`;

const fixture6 = `
const value = Platform.select({
  ios: false,
  android() {}
});
`;

describe('stripDeadPlatformSelect transform', () => {
  it('should replace Platform.select with value for default case if there is no matching platform', () => {
    const { code } = transformSync(fixture1, {
      plugins: [[stripDeadPlatformSelect, { platform: 'custom' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch(/const value = {\s*test: true\s*}/);
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
  });

  it('should replace Platform.select with value for matching platform', () => {
    const { code } = transformSync(fixture2, {
      plugins: [[stripDeadPlatformSelect, { platform: 'ios' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch('const value = () => {};');
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select', () => {
    const { code } = transformSync(fixture2, {
      plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch('...defaults');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });

  it('should replace Platform.select with undefined if no cases are matching', () => {
    const { code } = transformSync(fixture3, {
      plugins: [[stripDeadPlatformSelect, { platform: 'ios' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toEqual('const value = undefined;');
  });

  it('should remove non-matching platforms but leave Platform.select with unknown cases 1', () => {
    const { code } = transformSync(fixture4, {
      plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch("['andr' + 'oid']: () => {}");
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select with unknown cases and default case', () => {
    const { code } = transformSync(fixture5, {
      plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch("['andr' + 'oid']() {}");
    expect(code).toMatch('Platform.select');
    expect(code).toMatch("default: 'default',");
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select with method', () => {
    const { code } = transformSync(fixture6, {
      plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch('android() {}');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });
});
