import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps, cleanup, run } from '../../utils/common';
import {
  validateBaseBundle,
  validateHostBundle,
  validateAppBundle,
} from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(__dirname, '../../../fixtures/monorepo');
const PACKAGES = ['base-dll', 'app0', 'host'];
const PORT = 8086;

describe('in multi-bundle monorepo', () => {
  beforeAll(() => {
    installDeps(TEST_PROJECT_DIR);
    compileBundles();
  });

  afterAll(() => {
    PACKAGES.forEach(name => {
      cleanup(path.join(TEST_PROJECT_DIR, name, 'dist/ios'));
      cleanup(path.join(TEST_PROJECT_DIR, name, 'dist/android'));
    });
  });

  describe('packager server', () => {
    let instance: Instance;

    beforeAll(done => {
      instance = startServer(
        PORT,
        path.join(TEST_PROJECT_DIR, 'host'),
        undefined,
        done,
        { skipInstall: true }
      );
    });

    afterAll(() => {
      stopServer(instance);
    });

    it('compile bundles for iOS', async () => {
      const bundles = await fetchBundles('ios');
      validateBaseBundle(bundles.baseDll, {
        platform: 'ios',
      });
      validateHostBundle(bundles.host);
      validateAppBundle(bundles.app0, { platform: 'ios' });
    });

    it('compile bundles for Android', async () => {
      const bundles = await fetchBundles('android');
      validateBaseBundle(bundles.baseDll, {
        platform: 'android',
      });
      validateHostBundle(bundles.host);
      validateAppBundle(bundles.app0, { platform: 'android' });
    });
  });

  describe('multi-bundle command', () => {
    it('compile bundles', () => {
      const hostIosDevBundle = fs.readFileSync(
        path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/index.jsbundle')
      );
      const baseDllIosDevBundle = fs.readFileSync(
        path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/base_dll.jsbundle')
      );
      const appIosDevBundle = fs.readFileSync(
        path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/app0.jsbundle')
      );

      validateBaseBundle(baseDllIosDevBundle, {
        platform: 'ios',
      });
      validateHostBundle(hostIosDevBundle);
      validateAppBundle(appIosDevBundle, { platform: 'ios' });

      expect(
        fs.existsSync(
          path.join(
            TEST_PROJECT_DIR,
            'host/dist/ios/dev/assets/node_modules/react-navigation-stack/lib/module/views/assets/back-icon.png'
          )
        )
      ).toBe(true);

      const hostAndroidDevBundle = fs.readFileSync(
        path.join(
          TEST_PROJECT_DIR,
          'host/dist/android/dev/index.android.bundle'
        )
      );
      const baseDllAndroidDevBundle = fs.readFileSync(
        path.join(
          TEST_PROJECT_DIR,
          'host/dist/android/dev/base_dll.android.bundle'
        )
      );
      const appAndroidDevBundle = fs.readFileSync(
        path.join(TEST_PROJECT_DIR, 'host/dist/android/dev/app0.android.bundle')
      );

      validateBaseBundle(baseDllAndroidDevBundle, {
        platform: 'android',
      });
      validateHostBundle(hostAndroidDevBundle);
      validateAppBundle(appAndroidDevBundle, { platform: 'android' });

      expect(
        fs.existsSync(
          path.join(
            TEST_PROJECT_DIR,
            'host/dist/android/dev/drawable-mdpi/node_modules_reactnavigationstack_lib_module_views_assets_backicon.png'
          )
        )
      ).toBe(true);
    });
  });
});

async function fetchBundles(platform: string) {
  const host = await (
    await fetch(`http://localhost:${PORT}/index.${platform}.bundle`)
  ).buffer();
  const baseDll = await (
    await fetch(`http://localhost:${PORT}/base_dll.${platform}.bundle`)
  ).buffer();
  const app0 = await (
    await fetch(`http://localhost:${PORT}/app0.${platform}.bundle`)
  ).buffer();

  return {
    baseDll,
    host,
    app0,
  };
}

function compileBundles() {
  const { stdout } = run('yarn build', TEST_PROJECT_DIR);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}
