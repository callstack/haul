/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

import path from 'path';
import fetch from 'node-fetch';
import stripAnsi from 'strip-ansi';
import { run, yarnCommand } from '../utils';
import { runHaul } from '../runHaul';

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
      server = runHaul(TEST_PROJECT_DIR, ['start']);

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

    it('compile bundles for iOS platform', async () => {
      const bundles = await fetchBundles('ios');
      assertBundles(bundles);
    });

    it('compile bundles for Android platform', async () => {
      const bundles = await fetchBundles('android');
      assertBundles(bundles);
    });
  });
});

async function fetchBundles(platform) {
  const host = await (await fetch(
    `http://localhost:8081/index.${platform}.bundle`
  )).text();
  const baseDll = await (await fetch(
    `http://localhost:8081/base_dll.${platform}.bundle`
  )).text();
  const app0 = await (await fetch(
    `http://localhost:8081/app0.${platform}.bundle`
  )).text();
  const app1 = await (await fetch(
    `http://localhost:8081/app1.${platform}.bundle`
  )).text();
  const app1Chunk = await (await fetch(
    `http://localhost:8081/0.app1.${platform}.bundle`
  )).text();

  return {
    baseDll,
    host,
    app0,
    app1,
    app1Chunk,
  };
}

function assertBundles(bundles) {
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
  expect(bundles.app1).toMatch('function asyncEval');
  expect(bundles.app1).toMatch(
    /return asyncEval\("" \+ chunkId \+ "\.app1\.(ios|android)\.bundle"\);/g
  );

  expect(bundles.app1Chunk).toMatch('this["webpackChunkapp1"]');
  expect(bundles.app1Chunk).toMatch('./src/async.js');
  expect(bundles.app1Chunk).not.toMatch('base_dll');
}
