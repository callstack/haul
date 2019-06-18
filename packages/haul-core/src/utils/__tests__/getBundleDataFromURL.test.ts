import getBundleDataFromURL from '../getBundleDataFromURL';

describe('getBundleDataFromURL', () => {
  it('should create bundle data from HTTP urls with query params', () => {
    expect(
      getBundleDataFromURL(
        'http://localhost:8081/index.bundle?platform=android'
      )
    ).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'android',
      path: 'http://localhost:8081/',
    });
    expect(
      getBundleDataFromURL('http://localhost:8081/index.delta?platform=android')
    ).toEqual({
      name: 'index',
      type: 'delta',
      platform: 'android',
      path: 'http://localhost:8081/',
    });
    expect(
      getBundleDataFromURL('http://10.0.0.1:8081/index.delta?platform=android')
    ).toEqual({
      name: 'index',
      type: 'delta',
      platform: 'android',
      path: 'http://10.0.0.1:8081/',
    });
    expect(
      getBundleDataFromURL('https://domain.ext/index.bundle?platform=ios')
    ).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'ios',
      path: 'https://domain.ext/',
    });
  });

  it('should create bundle data from HTTP urls without query params', () => {
    expect(
      getBundleDataFromURL('http://localhost:8081/index.ios.bundle')
    ).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'ios',
      path: 'http://localhost:8081/',
    });
    expect(
      getBundleDataFromURL('http://localhost:8081/index.android.bundle')
    ).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'android',
      path: 'http://localhost:8081/',
    });
    expect(
      getBundleDataFromURL('http://10.0.0.1:8081/index.android.delta')
    ).toEqual({
      name: 'index',
      type: 'delta',
      platform: 'android',
      path: 'http://10.0.0.1:8081/',
    });
    expect(getBundleDataFromURL('https://domain.ext/index.ios.bundle')).toEqual(
      {
        name: 'index',
        type: 'bundle',
        platform: 'ios',
        path: 'https://domain.ext/',
      }
    );
  });

  it('should create bundle data from file urls', () => {
    expect(getBundleDataFromURL('/sdcard/index.bundle')).toEqual({
      name: 'index',
      type: 'bundle',
      platform: undefined,
      path: '/sdcard/',
    });
    expect(getBundleDataFromURL('/index.android.bundle')).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'android',
      path: '/',
    });
    expect(getBundleDataFromURL('resources/main.jsbundle')).toEqual({
      name: 'main',
      type: 'jsbundle',
      platform: undefined,
      path: 'resources/',
    });
    expect(getBundleDataFromURL('/index.ios.bundle')).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'ios',
      path: '/',
    });
    expect(getBundleDataFromURL('/foo/index.bar.baz.bundle')).toEqual({
      name: 'index.bar',
      type: 'bundle',
      platform: 'baz',
      path: '/foo/',
    });
  });

  it('should create bundle data from filename', () => {
    expect(getBundleDataFromURL('main.jsbundle')).toEqual({
      name: 'main',
      type: 'jsbundle',
      platform: undefined,
      path: '',
    });
    expect(getBundleDataFromURL('index.ios.bundle')).toEqual({
      name: 'index',
      type: 'bundle',
      platform: 'ios',
      path: '',
    });
    expect(getBundleDataFromURL('index.foo.bar.jsbundle')).toEqual({
      name: 'index.foo',
      type: 'jsbundle',
      platform: 'bar',
      path: '',
    });
  });
});
