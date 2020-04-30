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
  it('platform: android requesting bundle is working correctly', async () => {
    let instance = await startServerAsync(PORT, TEST_PROJECT_DIR);
    const { bundle: devFirstBundle } = await fetchBundle(PORT, 'android', {
      minify: false,
      dev: false,
    });

    validateBaseBundle(devFirstBundle, { platform: 'android' });

    expect(devFirstBundle.toString().includes('YellowBox.install()')).toBe(
      false
    );

    expect(
      devFirstBundle.toString().includes(`console.log('dev check', false)`)
    ).toBe(true);

    const {
      response: responseAfterBundleOptionsChanged,
      bundle: minifiedSecondBundle,
    } = await fetchBundle(PORT, 'android', {
      minify: true,
      dev: false,
    });

    expect(responseAfterBundleOptionsChanged.status).toBe(501);
    expect(minifiedSecondBundle.toString()).toBe(
      'Changing query params after the bundle has been created is not supported. To see the changes you need to restart the Haul server.'
    );

    stopServer(instance);
    instance = await startServerAsync(PORT, TEST_PROJECT_DIR);

    const { bundle: minifiedBundleAfterServerRestart } = await fetchBundle(
      PORT,
      'android',
      {
        minify: true,
        dev: false,
      }
    );

    validateBaseBundle(minifiedBundleAfterServerRestart);
    expect(minifiedBundleAfterServerRestart.toString().length).toBeLessThan(
      devFirstBundle.toString().length
    );
    stopServer(instance);
  });
});
