import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps, cleanup, run } from '../../utils/common';
import { assertBundles } from '../utils';

const TEST_PROJECT_DIR = path.resolve(__dirname, '../../../fixtures/monorepo');
const PACKAGES = ['base-dll', 'app0', 'host'];

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
        8082,
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
      assertBundles(bundles);
    });

    it('compile bundles for Android', async () => {
      const bundles = await fetchBundles('android');
      assertBundles(bundles);
    });
  });

  describe('multi-bundle command', () => {
    it('compile bundles', () => {
      assertBundles({
        host: fs
          .readFileSync(
            path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/index.jsbundle')
          )
          .toString(),
        baseDll: fs
          .readFileSync(
            path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/base_dll.jsbundle')
          )
          .toString(),
        app0: fs
          .readFileSync(
            path.join(TEST_PROJECT_DIR, 'host/dist/ios/dev/app0.jsbundle')
          )
          .toString(),
      });
      expect(
        fs.existsSync(
          path.join(
            TEST_PROJECT_DIR,
            'host/dist/ios/dev/assets/node_modules/react-navigation-stack/lib/module/views/assets/back-icon.png'
          )
        )
      ).toBe(true);

      assertBundles({
        host: fs
          .readFileSync(
            path.join(
              TEST_PROJECT_DIR,
              'host/dist/android/dev/index.android.bundle'
            )
          )
          .toString(),
        baseDll: fs
          .readFileSync(
            path.join(
              TEST_PROJECT_DIR,
              'host/dist/android/dev/base_dll.android.bundle'
            )
          )
          .toString(),
        app0: fs
          .readFileSync(
            path.join(
              TEST_PROJECT_DIR,
              'host/dist/android/dev/app0.android.bundle'
            )
          )
          .toString(),
      });

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
  const host = await (await fetch(
    `http://localhost:8082/index.${platform}.bundle`
  )).text();
  const baseDll = await (await fetch(
    `http://localhost:8082/base_dll.${platform}.bundle`
  )).text();
  const app0 = await (await fetch(
    `http://localhost:8082/app0.${platform}.bundle`
  )).text();

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
