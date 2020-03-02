import path from 'path';
import fetch from 'node-fetch';
import { Instance, startServer, stopServer } from '../../utils/server';
import { installDeps } from '../../utils/common';
import {
  validateAppBundle,
  validateBaseBundle,
  validateHostBundle,
} from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_multibundle'
);
const PORT = 8085;

beforeAll(() => installDeps(TEST_PROJECT_DIR));

describe('packager server', () => {
  let instance: Instance;

  beforeAll(done => {
    instance = startServer(
      PORT,
      TEST_PROJECT_DIR,
      'haul.config.multi.js',
      done
    );
  });

  afterAll(() => {
    stopServer(instance);
  });

  it('compile bundles for iOS', async () => {
    const bundles = await fetchBundles('ios');
    validateBaseBundle(bundles.baseDll, { platform: 'ios' });
    validateHostBundle(bundles.host);
    validateAppBundle(bundles.app0, { platform: 'ios' });
    validateAppBundle(bundles.app1, { platform: 'ios' });
  });

  it('compile bundles for Android', async () => {
    const bundles = await fetchBundles('android');
    validateBaseBundle(bundles.baseDll, { platform: 'android' });
    validateHostBundle(bundles.host);
    validateAppBundle(bundles.app0, { platform: 'android' });
    validateAppBundle(bundles.app1, { platform: 'android' });
  });
});

async function fetchBundles(platform: string) {
  const host = await (
    await fetch(`http://localhost:${PORT}/host.${platform}.bundle`)
  ).buffer();
  const baseDll = await (
    await fetch(`http://localhost:${PORT}/base_dll.${platform}.bundle`)
  ).buffer();
  const app0 = await (
    await fetch(`http://localhost:${PORT}/app0.${platform}.bundle`)
  ).buffer();
  const app1 = await (
    await fetch(`http://localhost:${PORT}/app1.${platform}.bundle`)
  ).buffer();

  return {
    baseDll,
    host,
    app0,
    app1,
  };
}
