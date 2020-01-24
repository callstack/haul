import path from 'path';
import fs from 'fs';
import { installDeps, cleanup } from './common';
import { runHaulSync } from './runHaul';
import {
  validateBaseBundle,
  validateHostBundle,
  validateAppBundle,
} from './validators';

export default function createBundlingTestSuite(
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
      cleanup(path.join(PROJECT_FIXTURE, 'dist/non-min'));
    });

    it('should bundle for single Indexed RAM bundle', () => {
      const BUNDLE_PATH = `dist/non-min/${platform}/index.${platform}.bundle`;
      const { stderr } = runHaulSync(PROJECT_FIXTURE, [
        'bundle',
        '--platform',
        platform,
        '--dev',
        'false',
        '--minify',
        'false',
        '--bundle-output',
        BUNDLE_PATH,
        '--assets-dest',
        `dist/non-min/${platform}`,
        '--max-workers',
        '1',
        '--progress',
        'none',
      ]);

      expect(stderr.length).toBe(0);
      const bundle = fs.readFileSync(path.join(PROJECT_FIXTURE, BUNDLE_PATH));
      validateBaseBundle(bundle, { platform, isIndexedRAMBundle: true });
    });

    it('should bundle for host, base_dll and apps bundles', () => {
      const { stderr } = runHaulSync(PROJECT_FIXTURE, [
        'multi-bundle',
        '--platform',
        platform,
        '--dev',
        'false',
        '--minify',
        'false',
        '--bundle-output',
        `dist/non-min/${platform}`,
        '--assets-dest',
        `dist/non-min/${platform}`,
        '--config',
        'haul.config.multi.js',
        '--max-workers',
        '1',
        '--progress',
        'none',
      ]);

      expect(stderr.length).toBe(0);
      const baseDllBundle = fs.readFileSync(
        path.join(
          PROJECT_FIXTURE,
          `dist/non-min/${platform}/base_dll.${platform}.bundle`
        )
      );
      const hostBundle = fs.readFileSync(
        path.join(
          PROJECT_FIXTURE,
          `dist/non-min/${platform}/host.${platform}.bundle`
        )
      );
      const app0Bundle = fs.readFileSync(
        path.join(
          PROJECT_FIXTURE,
          `dist/non-min/${platform}/app0.${platform}.bundle`
        )
      );
      const app1Bundle = fs.readFileSync(
        path.join(
          PROJECT_FIXTURE,
          `dist/non-min/${platform}/app1.${platform}.bundle`
        )
      );

      validateBaseBundle(baseDllBundle, { platform, isIndexedRAMBundle: true });
      validateHostBundle(hostBundle);
      validateAppBundle(app0Bundle, { platform, isIndexedRAMBundle: true });
      validateAppBundle(app1Bundle, { platform, isIndexedRAMBundle: true });
    });
  });
}
