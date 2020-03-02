import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps, cleanup } from '../../utils/common';
import { runHaulSync } from '../../utils/runHaul';
import {
  validateBaseBundle,
  validateHostBundle,
  validateAppBundle,
} from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_multibundle'
);
const EXTERNAL_DLL_PATH = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_multibundle/node_modules/external-base-dll'
);

describe('for external bundle', () => {
  beforeAll(() => {
    installDeps(TEST_PROJECT_DIR);
  });

  afterAll(() => {
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/external/ios'));
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/external/android'));
  });

  it('should build external DLL bundle for server and production and use it', async () => {
    compileExternalBundles('ios');
    fs.existsSync(path.join(EXTERNAL_DLL_PATH, 'ios/base_dll.jsbundle'));
    fs.existsSync(path.join(EXTERNAL_DLL_PATH, 'ios/base_dll_server.jsbundle'));
    compileExternalBundles('android');
    fs.existsSync(
      path.join(EXTERNAL_DLL_PATH, 'android/base_dll.android.bundle')
    );
    fs.existsSync(
      path.join(EXTERNAL_DLL_PATH, 'android/base_dll_server.android.bundle')
    );

    compileBundles('ios');
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/ios/base_dll.jsbundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/ios/base_dll.jsbundle.map')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/ios/main.jsbundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/ios/app0.jsbundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/ios/app1.jsbundle')
    );
    compileBundles('android');
    fs.existsSync(
      path.join(
        TEST_PROJECT_DIR,
        'dist/external/android/base_dll.android.bundle'
      )
    );
    fs.existsSync(
      path.join(
        TEST_PROJECT_DIR,
        'dist/external/android/base_dll.android.bundle.map'
      )
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/android/index.android.bundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/android/app0.android.bundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/external/android/app1.android.bundle')
    );

    const server = await new Promise<Instance>((resolve, reject) => {
      let instance: Instance;
      const done = () => {
        resolve(instance);
      };
      done.fail = reject;
      instance = startServer(
        9000,
        TEST_PROJECT_DIR,
        'haul.config.external.js',
        done
      );
    });

    const iosBundles = await fetchBundles('ios');
    validateBaseBundle(iosBundles.baseDll, { platform: 'ios' });
    validateHostBundle(iosBundles.host);
    validateAppBundle(iosBundles.app0, { platform: 'ios' });
    validateAppBundle(iosBundles.app1, { platform: 'ios' });

    const androidBundles = await fetchBundles('android');
    validateBaseBundle(androidBundles.baseDll, { platform: 'android' });
    validateHostBundle(androidBundles.host);
    validateAppBundle(androidBundles.app0, { platform: 'android' });
    validateAppBundle(androidBundles.app1, { platform: 'android' });

    stopServer(server);
  });
});

function compileExternalBundles(platform: string) {
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'multi-bundle',
    '--platform',
    platform,
    '--dev',
    'true',
    '--bundle-output',
    path.join(EXTERNAL_DLL_PATH, platform),
    '--assets-dest',
    path.join(EXTERNAL_DLL_PATH, platform),
    '--config',
    'haul.config.dll.js',
    '--skip-host-check',
    '--max-workers',
    '1',
    '--progress',
    'none',
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}

function compileBundles(platform: string) {
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'multi-bundle',
    '--platform',
    platform,
    '--dev',
    'true',
    '--bundle-output',
    `dist/external/${platform}`,
    '--assets-dest',
    `dist/external/${platform}`,
    '--config',
    'haul.config.external.js',
    '--max-workers',
    '1',
    '--progress',
    'none',
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}

async function fetchBundles(platform: string) {
  const host = await (
    await fetch(`http://localhost:9000/index.${platform}.bundle`)
  ).buffer();
  const baseDll = await (
    await fetch(`http://localhost:9000/base_dll.${platform}.bundle`)
  ).buffer();
  const app0 = await (
    await fetch(`http://localhost:9000/app0.${platform}.bundle`)
  ).buffer();
  const app1 = await (
    await fetch(`http://localhost:9000/app1.${platform}.bundle`)
  ).buffer();

  await (
    await fetch(
      `http://localhost:9000/base_dll_server.${
        platform === 'ios' ? 'jsbundle' : 'android.bundle'
      }.map`
    )
  ).json();

  return {
    baseDll,
    host,
    app0,
    app1,
  };
}
