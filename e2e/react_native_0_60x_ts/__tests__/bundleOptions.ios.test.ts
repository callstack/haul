import path from 'path';
import { fetchBundle } from '../../utils/bundle';
import { startServerAsync, stopServer } from '../../utils/server';
import { validateBaseBundle } from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_ts'
);
const PORT = 8086;

describe('packager server', () => {
  it('platform: ios requesting bundle is working correctly', async () => {
    let instance = await startServerAsync(PORT, TEST_PROJECT_DIR);
    let results = await fetchBundle(PORT, 'ios', {
      minify: false,
      dev: false,
    });

    validateBaseBundle(results.bundle, { platform: 'ios' });

    expect(results.bundle.toString().includes('YellowBox.install()')).toBe(
      false
    );
    expect(
      results.bundle
        .toString()
        .includes(`"running in ",  false ? undefined : 'prod'`)
    ).toBe(true);

    const nonMinifiedBundleLength = results.bundle.toString().length;

    results = await fetchBundle(PORT, 'ios', {
      minify: false,
      dev: true,
    });

    expect(results.response.status).toBe(501);
    expect(results.bundle.toString()).toEqual(
      'Changing query params after the bundle has been created is not supported. To see the changes you need to restart the Haul server.'
    );

    stopServer(instance);
    instance = await startServerAsync(PORT, TEST_PROJECT_DIR);

    results = await fetchBundle(PORT, 'ios', {
      minify: false,
      dev: true,
    });

    expect(
      results.bundle
        .toString()
        .includes(`"running in ",  true ? 'dev' : undefined`)
    ).toBe(true);

    results = await fetchBundle(PORT, 'ios', {
      minify: true,
      dev: false,
    });

    expect(results.response.status).toBe(501);
    expect(results.bundle.toString()).toEqual(
      'Changing query params after the bundle has been created is not supported. To see the changes you need to restart the Haul server.'
    );

    stopServer(instance);
    instance = await startServerAsync(PORT, TEST_PROJECT_DIR);

    results = await fetchBundle(PORT, 'ios', {
      minify: true,
      dev: false,
    });

    validateBaseBundle(results.bundle);
    expect(results.bundle.toString().length).toBeLessThan(
      nonMinifiedBundleLength
    );

    stopServer(instance);
    instance = await startServerAsync(PORT, TEST_PROJECT_DIR);

    results = await fetchBundle(PORT, 'ios', {
      minify: true,
      dev: true,
    });

    expect(results.bundle.toString().length).toBeLessThan(
      nonMinifiedBundleLength
    );
    expect(results.bundle.toString().includes(`"running in ","dev"`)).toBe(
      true
    );

    stopServer(instance);
  });

  it('platform: ios requesting bundle is working correctly with unspecified query bundle options', async () => {
    const defaultMinifyOption = false;
    let instance = await startServerAsync(PORT, TEST_PROJECT_DIR);
    let results = await fetchBundle(PORT, 'ios', {
      dev: true,
    });
    validateBaseBundle(results.bundle, { platform: 'ios' });
    await fetchBundle(PORT, 'ios', {
      dev: true,
    });

    await fetchBundle(PORT, 'ios', {
      dev: true,
      minify: defaultMinifyOption,
    });

    results = await fetchBundle(PORT, 'ios', {
      dev: false,
    });

    expect(results.response.status).toBe(501);
    expect(results.bundle.toString()).toEqual(
      'Changing query params after the bundle has been created is not supported. To see the changes you need to restart the Haul server.'
    );

    stopServer(instance);
  });
});
