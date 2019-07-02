import { transformSync } from '@babel/core';
import dedent from 'dedent';
import stripDeadPlatformSelect from '../stripDeadPlatformSelect';

describe('stripDeadPlatformSelect transform', () => {
  it('should replace Platform.select with value for default case if there is no matching platform', () => {
    const { code } = transformSync(
      dedent`
      const value = Platform.select({
        android: 'android',
        ios: () => {},
        default: { test: true },
        web: 'what?'
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'custom' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch(/const value = {\s*test: true\s*}/);
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
  });

  it('should replace Platform.select with value for matching platform', () => {
    const { code } = transformSync(
      dedent`
      const defaults = { default: 'default' };
      const value = Platform.select({
        ios: () => {},
        ...defaults,
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'ios' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch('const value = () => {};');
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select', () => {
    const { code } = transformSync(
      dedent`
      const defaults = { default: 'default' };
      const value = Platform.select({
        ios: () => {},
        ...defaults,
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch('...defaults');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });

  it('should replace Platform.select with undefined if no cases are matching', () => {
    const { code } = transformSync(
      dedent`
      const value = Platform.select({
        android: () => {},
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'ios' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toEqual('const value = undefined;');
  });

  it('should remove non-matching platforms but leave Platform.select with unknown cases 1', () => {
    const { code } = transformSync(
      dedent`
      const value = Platform.select({
        ios: false,
        ['andr' + 'oid']: () => {},
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch("['andr' + 'oid']: () => {}");
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select with unknown cases and default case', () => {
    const { code } = transformSync(
      dedent`
      const value = Platform.select({
        default: 'default',
        ['andr' + 'oid']() {}
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch("['andr' + 'oid']() {}");
    expect(code).toMatch('Platform.select');
    expect(code).toMatch("default: 'default',");
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select with method', () => {
    const { code } = transformSync(
      dedent`
      const value = Platform.select({
        ios: false,
        android() {}
      });
      `,
      {
        plugins: [[stripDeadPlatformSelect, { platform: 'android' }]],
        babelrc: false,
        configFile: false,
      }
    ) || { code: '' };

    expect(code).toMatch('android() {}');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });
});
