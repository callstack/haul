import path from 'path';
import { installDeps, cleanup } from './common';
import { runHaulSync } from './runHaul';
import { kilobytes, validateBundleSize } from './bundleSize';

export default function createSizeTestSuite(
  projectName: string,
  platform: string,
  {
    min,
    maxIndexBundle,
    maxBaseBundle,
  }: { min: number; maxIndexBundle: number; maxBaseBundle: number }
) {
  const PROJECT_FIXTURE = path.join(__dirname, '../../fixtures', projectName);

  // eslint-disable-next-line jest/valid-describe
  describe(projectName, () => {
    beforeAll(() => {
      installDeps(PROJECT_FIXTURE);
    });

    afterAll(() => {
      cleanup(path.join(PROJECT_FIXTURE, 'dist/min'));
    });

    it(`minified Indexed RAM bundle should be have size between ${min}kb and ${maxIndexBundle}kb`, () => {
      const BUNDLE_PATH = `dist/min/${platform}/index.${platform}.bundle`;
      runHaulSync(PROJECT_FIXTURE, [
        'bundle',
        '--platform',
        platform,
        '--dev',
        'false',
        '--bundle-output',
        BUNDLE_PATH,
        '--assets-dest',
        `dist/min/${platform}`,
        '--max-workers',
        '1',
        '--progress',
        'none',
      ]);

      validateBundleSize(
        path.join(PROJECT_FIXTURE, BUNDLE_PATH),
        kilobytes(min),
        kilobytes(maxIndexBundle)
      );
    });

    it('minified host, base_dll and apps bundles should have correct size', () => {
      runHaulSync(PROJECT_FIXTURE, [
        'multi-bundle',
        '--platform',
        platform,
        '--dev',
        'false',
        '--bundle-output',
        `dist/min/${platform}`,
        '--assets-dest',
        `dist/min/${platform}`,
        '--config',
        'haul.config.multi.js',
        '--max-workers',
        '1',
        '--progress',
        'none',
      ]);

      validateBundleSize(
        path.join(
          PROJECT_FIXTURE,
          `dist/min/${platform}/host.${platform}.bundle`
        ),
        kilobytes(1),
        kilobytes(8)
      );
      validateBundleSize(
        path.join(
          PROJECT_FIXTURE,
          `dist/min/${platform}/base_dll.${platform}.bundle`
        ),
        kilobytes(min),
        kilobytes(maxBaseBundle)
      );
      validateBundleSize(
        path.join(
          PROJECT_FIXTURE,
          `dist/min/${platform}/app0.${platform}.bundle`
        ),
        kilobytes(1),
        kilobytes(8)
      );
      validateBundleSize(
        path.join(
          PROJECT_FIXTURE,
          `dist/min/${platform}/app1.${platform}.bundle`
        ),
        kilobytes(1),
        kilobytes(8)
      );
    });
  });
}
