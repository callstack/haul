import path from 'path';
import { installDeps, cleanup } from '../../../integration_tests/utils/common';
import { runHaulSync } from '../../../integration_tests/utils/runHaul';
import { kilobytes, validateBundleSize } from '../../utils/bundleSize';

const PROJECT_FIXTURE = path.join(
  __dirname,
  '../../../fixtures/react_native_windows_current'
);

describe('react_native_windows_current', () => {
  beforeAll(() => {
    installDeps(PROJECT_FIXTURE);
  });

  afterAll(() => {
    cleanup(path.join(PROJECT_FIXTURE, 'dist/min'));
  });

  it('minified Indexed RAM bundle should be have size between 600kb and 920kb', () => {
    const BUNDLE_PATH = 'dist/min/index.windows.bundle';
    runHaulSync(PROJECT_FIXTURE, [
      'bundle',
      '--platform',
      'windows',
      '--dev',
      'false',
      '--bundle-output',
      BUNDLE_PATH,
      '--assets-dest',
      'dist/min',
    ]);

    validateBundleSize(
      path.join(PROJECT_FIXTURE, BUNDLE_PATH),
      kilobytes(600),
      kilobytes(920)
    );
  });

  it('minified host, base_dll and apps bundles should have correct size', () => {
    runHaulSync(PROJECT_FIXTURE, [
      'multi-bundle',
      '--platform',
      'windows',
      '--dev',
      'false',
      '--bundle-output',
      'dist/min',
      '--assets-dest',
      'dist/min',
      '--config',
      'haul.config.multi.js',
    ]);

    validateBundleSize(
      path.join(PROJECT_FIXTURE, 'dist/min/host.windows.bundle'),
      kilobytes(1),
      kilobytes(8)
    );
    validateBundleSize(
      path.join(PROJECT_FIXTURE, 'dist/min/base_dll.windows.bundle'),
      kilobytes(600),
      kilobytes(1100)
    );
    validateBundleSize(
      path.join(PROJECT_FIXTURE, 'dist/min/app0.windows.bundle'),
      kilobytes(1),
      kilobytes(8)
    );
    validateBundleSize(
      path.join(PROJECT_FIXTURE, 'dist/min/app1.windows.bundle'),
      kilobytes(1),
      kilobytes(8)
    );
  });
});
