import path from 'path';
import fetch from 'node-fetch';
import { Instance, startServer, stopServer } from '../../utils/server';
import { validateBaseBundle } from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_ts'
);
const PORT = 8086;

describe('packager server', () => {
  it('platform: android requesting bundle is working correctly', async () => {
    let instance = await startServerAsync();
    const { bundle: devFirstBundle } = await fetchBundle('android', {
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
    } = await fetchBundle('android', {
      minify: true,
      dev: false,
    });

    expect(responseAfterBundleOptionsChanged.status).toBe(501);
    expect(minifiedSecondBundle.toString()).toBe(
      'To see the changes you need to restart the haul server'
    );

    stopServer(instance);
    instance = await startServerAsync();

    const { bundle: minifiedBundleAfterServerRestart } = await fetchBundle(
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

async function fetchBundle(
  platform: string,
  options?: { minify: boolean; dev: boolean }
) {
  const builtOptions = options
    ? `?dev=${options.dev}&minify=${options.minify}`
    : '';

  const response = await fetch(
    `http://localhost:${PORT}/index.${platform}.bundle${builtOptions}`
  );

  return { bundle: await response.buffer(), response };
}

async function startServerAsync(): Promise<Instance> {
  return new Promise((resolve, reject) => {
    const done = () => {
      resolve(instance);
    };
    done.fail = reject;
    const instance = startServer(PORT, TEST_PROJECT_DIR, undefined, done);
  });
}
