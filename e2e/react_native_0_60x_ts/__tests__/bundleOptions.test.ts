import path from 'path';
import fetch from 'node-fetch';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps, cleanup, run } from '../../utils/common';
import { validateBaseBundle } from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_ts'
);
const PORT = 8086;

const platforms = [['android'], ['ios']];

describe('compiling bundle with options', () => {
  beforeAll(() => {
    installDeps(TEST_PROJECT_DIR);
    compileBundles();
  });

  afterAll(() => {
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/ios'));
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/android'));
  });
});

describe('packager server', () => {
  let instance: Instance;

  beforeAll(done => {
    instance = startServer(PORT, TEST_PROJECT_DIR, undefined, done, {
      skipInstall: true,
    });
  });

  afterAll(() => {
    stopServer(instance);
  });

  test.each(platforms)(
    'platform: %s requesting bundle is working correctly',
    async platform => {
      const { bundle: devFirstBundle } = await fetchBundle(platform, {
        minify: false,
        dev: false,
      });

      validateBaseBundle(devFirstBundle, { platform, log: true });

      expect(devFirstBundle.toString().includes('YellowBox.install()')).toBe(
        false
      );

      expect(
        devFirstBundle.toString().includes(`console.log('dev check', false)`)
      ).toBe(true);

      const {
        response: responseAfterBundleOptionsChanged,
        bundle: minifiedSecondBundle,
      } = await fetchBundle(platform, {
        minify: true,
        dev: false,
      });

      expect(responseAfterBundleOptionsChanged.status).toBe(501);
      expect(minifiedSecondBundle.toString()).toBe(
        'To see the changes you need to restart the haul server'
      );

      stopServer(instance);
      await new Promise((resolve, reject) => {
        const done = () => {
          resolve(instance);
        };
        done.fail = reject;
        instance = startServer(PORT, TEST_PROJECT_DIR, undefined, done, {
          skipInstall: true,
        });
      });

      const { bundle: minifiedBundleAfterServerRestart } = await fetchBundle(
        platform,
        {
          minify: true,
          dev: false,
        }
      );

      validateBaseBundle(minifiedBundleAfterServerRestart);
      expect(minifiedBundleAfterServerRestart.toString().length).toBeLessThan(
        devFirstBundle.toString().length
      );
    }
  );
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

function compileBundles() {
  const { stdout } = run('yarn build', TEST_PROJECT_DIR);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}
