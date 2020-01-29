import path from 'path';
import fs from 'fs';

import { installDeps } from './common';
import { runHaulSync } from './runHaul';
import { cleanup } from './bundle';

export default function createBuildTimeTestSuite(
  projectName: string,
  platform: string
) {
  const PROJECT_FIXTURE = path.join(__dirname, '../../fixtures', projectName);

  // eslint-disable-next-line jest/valid-describe
  describe(projectName, () => {
    beforeAll(() => {
      installDeps(PROJECT_FIXTURE);
    });

    afterAll(() => {
      cleanup(PROJECT_FIXTURE);
    });

    it(`minified Indexed RAM build time should be short`, () => {
      const BUNDLE_PATH = `dist/min/${platform}/index.${platform}.bundle`;
      const startTime = Date.now();

      runHaulSync(PROJECT_FIXTURE, [
        'ram-bundle',
        '--platform',
        platform,
        '--dev',
        'false',
        '--bundle-output',
        BUNDLE_PATH,
        '--assets-dest',
        `dist/min/${platform}`,
        '--max-workers',
        '2',
        '--progress',
        'none',
      ]);

      const processTime = Date.now() - startTime;
      console.log({ processTime });

      expect(
        fs.existsSync(path.join(PROJECT_FIXTURE, BUNDLE_PATH))
      ).toBeTruthy();
      if (platform === 'android') {
        expect(
          fs.existsSync(
            path.join(
              path.dirname(path.join(PROJECT_FIXTURE, BUNDLE_PATH)),
              'js-modules/UNBUNDLE'
            )
          )
        ).toBeTruthy();
      }

      expect(processTime).toBeLessThan(24000);
    });
  });
}
