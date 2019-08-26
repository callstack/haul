import path from 'path';
import fetch from 'node-fetch';
import { Instance, startServer, stopServer } from '../../utils/server';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x'
);

describe('packager server', () => {
  let instance: Instance;

  beforeAll(done => {
    instance = startServer(8083, TEST_PROJECT_DIR, undefined, done);
  });

  afterAll(() => {
    stopServer(instance);
  });

  it('compile bundle for iOS platform', () => testPlatform('ios'));

  it('compile bundle for Android platform', () => testPlatform('android'));

  it('compile bundle for both platforms', () =>
    Promise.all([testPlatform('ios'), testPlatform('android')]));
});

async function testPlatform(platform: string) {
  const res = await fetch(`http://localhost:8083/index.${platform}.bundle`);
  const bundle = await res.text();
  expect(bundle).toMatch('__webpack_require__');
}
