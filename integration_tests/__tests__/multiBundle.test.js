import path from 'path';
import fetch from 'node-fetch';
import stripAnsi from 'strip-ansi';
import fs from 'fs';
import { run, yarnCommand, cleanup } from '../utils';
import { runHaul, runHaulSync } from '../runHaul';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../fixtures/react_native_with_haul_0_60x_multibundle'
);

describe('in multi-bundle mode', () => {
  beforeAll(() => {
    run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR);
  });

  describe('packager server', () => {
    let server;
    let disposed = false;

    beforeAll(done => {
      server = runHaul(TEST_PROJECT_DIR, ['start', '--port', '8082']);

      server.stderr.on('data', data => {
        done.fail(data.toString());
      });

      server.stdout.on('data', data => {
        const message = stripAnsi(data.toString()).trim();
        if (message.match(/error/g) && !disposed) {
          done.fail(message);
        } else {
          done();
        }
      });
    });

    afterAll(() => {
      disposed = true;
      server.kill();
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
    afterAll(() => {
      cleanup(path.join(TEST_PROJECT_DIR, 'dist_ios'));
      cleanup(path.join(TEST_PROJECT_DIR, 'dist_android'));
    });

    it('compile bundles for iOS', () => {
      compileBundles('ios');

      assertBundles(
        {
          host: fs
            .readFileSync(
              path.join(TEST_PROJECT_DIR, 'dist_ios/index.jsbundle')
            )
            .toString(),
          baseDll: fs
            .readFileSync(
              path.join(TEST_PROJECT_DIR, 'dist_ios/base_dll.jsbundle')
            )
            .toString(),
          app0: fs
            .readFileSync(path.join(TEST_PROJECT_DIR, 'dist_ios/app0.jsbundle'))
            .toString(),
          app1: fs
            .readFileSync(path.join(TEST_PROJECT_DIR, 'dist_ios/app1.jsbundle'))
            .toString(),
        },
        true
      );
    });

    it('compile bundles for Android', () => {
      compileBundles('android');

      assertBundles(
        {
          host: fs
            .readFileSync(
              path.join(TEST_PROJECT_DIR, 'dist_android/index.android.bundle')
            )
            .toString(),
          baseDll: fs
            .readFileSync(
              path.join(
                TEST_PROJECT_DIR,
                'dist_android/base_dll.android.bundle'
              )
            )
            .toString(),
          app0: fs
            .readFileSync(
              path.join(TEST_PROJECT_DIR, 'dist_android/app0.android.bundle')
            )
            .toString(),
          app1: fs
            .readFileSync(
              path.join(TEST_PROJECT_DIR, 'dist_android/app1.android.bundle')
            )
            .toString(),
        },
        true
      );
    });
  });
});

async function fetchBundles(platform) {
  const host = await (await fetch(
    `http://localhost:8082/index.${platform}.bundle`
  )).text();
  const baseDll = await (await fetch(
    `http://localhost:8082/base_dll.${platform}.bundle`
  )).text();
  const app0 = await (await fetch(
    `http://localhost:8082/app0.${platform}.bundle`
  )).text();
  const app1 = await (await fetch(
    `http://localhost:8082/app1.${platform}.bundle`
  )).text();
  const app1Chunk = await (await fetch(
    `http://localhost:8082/0.app1.${platform}.bundle`
  )).text();

  return {
    baseDll,
    host,
    app0,
    app1,
    app1Chunk,
  };
}

function assertBundles(bundles, staticBundles = false) {
  expect(bundles.baseDll).toMatch('this["base_dll"] =');
  expect(bundles.baseDll).toMatch('node_modules/react');
  expect(bundles.baseDll).toMatch('node_modules/react-native');
  expect(bundles.baseDll).toMatch('BundleRegistry');
  expect(bundles.baseDll).toMatch('module.exports = __webpack_require__;');

  expect(bundles.host).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.host).toMatch('dll-reference base_dll');
  expect(bundles.host).toMatch('./src/host.js');

  expect(bundles.app0).toMatch('this["app0"] =');
  expect(bundles.app0).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.app0).toMatch('dll-reference base_dll');
  expect(bundles.app0).toMatch('./src/app0');

  expect(bundles.app1).toMatch('this["app1"] =');
  expect(bundles.app1).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.app1).toMatch('dll-reference base_dll');
  expect(bundles.app1).toMatch('./src/app1');
  if (staticBundles) {
    expect(bundles.app1).toMatch('throw new Error("Invalid bundle');
  } else {
    expect(bundles.app1).toMatch('function asyncEval');
    expect(bundles.app1).toMatch(
      /return asyncEval\("" \+ chunkId \+ "\.app1\.(ios|android)\.bundle"\);/g
    );

    expect(bundles.app1Chunk).toMatch('this["webpackChunkapp1"]');
    expect(bundles.app1Chunk).toMatch('./src/async.js');
    expect(bundles.app1Chunk).not.toMatch('base_dll');
  }
}

function compileBundles(platform) {
  const { stdout } = runHaulSync(TEST_PROJECT_DIR, [
    'multi-bundle',
    '--platform',
    platform,
    '--dev',
    'true',
    '--bundle-output',
    `dist_${platform}`,
    '--assets-dest',
    'dist_ios',
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
}
