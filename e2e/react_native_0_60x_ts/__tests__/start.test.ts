import path from 'path';
import {
  Instance,
  startServer,
  stopServer,
} from '../../../integration_tests/utils/server';
import { fetchAndValidateBundle } from '../../utils/validators';

const TEST_PROJECT_DIR = path.resolve(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x_ts'
);

describe('packager server', () => {
  let instance: Instance;

  beforeAll(done => {
    // server port is set in haul.config.js fort this project
    instance = startServer(8082, TEST_PROJECT_DIR, undefined, done);
  });

  afterAll(() => {
    stopServer(instance);
  });

  it('compile bundle for iOS platform', () =>
    fetchAndValidateBundle('http://localhost:8082/index.ios.bundle'));

  it('compile bundle for Android platform', () =>
    fetchAndValidateBundle('http://localhost:8082/index.android.bundle'));

  it('compile bundle for both platforms', () =>
    Promise.all([
      fetchAndValidateBundle('http://localhost:8082/index.bundle?platform=ios'),
      fetchAndValidateBundle(
        'http://localhost:8082/index.bundle?platform=android'
      ),
    ]));
});
