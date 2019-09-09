import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps, cleanup } from '../../utils/common';
import { runHaulSync } from '../../utils/runHaul';
import { assertBundles } from '../utils';

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
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/ios'));
    cleanup(path.join(TEST_PROJECT_DIR, 'dist/android'));
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
    fs.existsSync(path.join(TEST_PROJECT_DIR, 'dist/ios/base_dll.jsbundle'));
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/ios/base_dll.jsbundle.map')
    );
    fs.existsSync(path.join(TEST_PROJECT_DIR, 'dist/ios/main.jsbundle'));
    fs.existsSync(path.join(TEST_PROJECT_DIR, 'dist/ios/app0.jsbundle'));
    fs.existsSync(path.join(TEST_PROJECT_DIR, 'dist/ios/app1.jsbundle'));
    compileBundles('android');
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/android/base_dll.android.bundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/android/base_dll.android.bundle.map')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/android/index.android.bundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/android/app0.android.bundle')
    );
    fs.existsSync(
      path.join(TEST_PROJECT_DIR, 'dist/android/app1.android.bundle')
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
        './configs/haul.config.external.js',
        done
      );
    });

    assertBundles(await fetchBundles('ios'));
    assertBundles(await fetchBundles('android'));

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
    './configs/haul.config.dll.js',
    '--skip-host-check',
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
    `dist/${platform}`,
    '--assets-dest',
    `dist/${platform}`,
    '--config',
    './configs/haul.config.external.js',
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}

async function fetchBundles(platform: string) {
  const host = await (await fetch(
    `http://localhost:9000/index.${platform}.bundle`
  )).text();
  const baseDll = await (await fetch(
    `http://localhost:9000/base_dll.${platform}.bundle`
  )).text();
  const app0 = await (await fetch(
    `http://localhost:9000/app0.${platform}.bundle`
  )).text();
  const app1 = await (await fetch(
    `http://localhost:9000/app1.${platform}.bundle`
  )).text();
  const app1Chunk = await (await fetch(
    `http://localhost:9000/0.app1.${platform}.bundle`
  )).text();

  await (await fetch(
    `http://localhost:9000/base_dll_server.${
      platform === 'ios' ? 'jsbundle' : 'android.bundle'
    }.map`
  )).json();

  return {
    baseDll,
    host,
    app0,
    app1,
    app1Chunk,
  };
}
