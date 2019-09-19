import path from 'path';
import {
  Instance,
  startServer,
  stopServer,
} from '../../integration_tests/utils/server';
import { fetchAndValidateBundle } from './validators';

export default function createStartTestSuite(
  projectName: string,
  port: number
) {
  const PROJECT_FIXTURE = path.join(__dirname, '../../fixtures', projectName);

  describe('packager server', () => {
    let instance: Instance;

    beforeAll(done => {
      instance = startServer(port, PROJECT_FIXTURE, undefined, done);
    });

    afterAll(() => {
      stopServer(instance);
    });

    it('compile bundle for iOS platform', () =>
      fetchAndValidateBundle(`http://localhost:${port}/index.ios.bundle`));

    it('compile bundle for Android platform', () =>
      fetchAndValidateBundle(`http://localhost:${port}/index.android.bundle`));

    it('compile bundle for both platforms', () =>
      Promise.all([
        fetchAndValidateBundle(
          `http://localhost:${port}/index.bundle?platform=ios`
        ),
        fetchAndValidateBundle(
          `http://localhost:${port}/index.bundle?platform=android`
        ),
      ]));
  });
}
