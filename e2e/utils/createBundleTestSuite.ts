import path from 'path';
import fs from 'fs';
import { installDeps } from './common';
import { bundleForPlatform, cleanup } from './bundle';

export default function createBundleTestSuite(
  projectName: string,
  platform: string,
  {
    testRamBundle,
    checkAssets,
  }: { testRamBundle?: boolean; checkAssets?: boolean } = {}
) {
  const PROJECT_FIXTURE = path.join(__dirname, '../../fixtures', projectName);

  beforeAll(() => installDeps(PROJECT_FIXTURE));
  beforeEach(() => cleanup(PROJECT_FIXTURE));
  afterAll(() => cleanup(PROJECT_FIXTURE));

  function assertAssets(bundlePath: string) {
    if (checkAssets) {
      const dist = path.dirname(bundlePath);
      if (platform === 'android') {
        expect(
          fs.existsSync(
            path.join(dist, 'drawable-mdpi/node_modules_foo_asset.png')
          )
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(dist, 'drawable-mdpi/node_modules_baz_asset.png')
          )
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(
              dist,
              'drawable-mdpi/node_modules_foo_node_modules_bar_asset.png'
            )
          )
        ).toBe(true);
      } else {
        expect(
          fs.existsSync(path.join(dist, 'assets/node_modules/foo/asset.png'))
        ).toBe(true);
        expect(
          fs.existsSync(path.join(dist, 'assets/node_modules/baz/asset.png'))
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(
              dist,
              'assets/node_modules/foo/node_modules/bar/asset.png'
            )
          )
        ).toBe(true);
      }
    }
  }

  test(`bundle ${platform} project`, () => {
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, platform);
    expect(fs.existsSync(bundlePath)).toBeTruthy();
    assertAssets(bundlePath);
  });

  if (testRamBundle) {
    test(`bundle ${platform} project as RAM bundle`, () => {
      const bundlePath = bundleForPlatform(PROJECT_FIXTURE, platform, {
        ramBundle: true,
      });
      expect(fs.existsSync(bundlePath)).toBeTruthy();
      if (platform === 'android') {
        expect(
          fs.existsSync(
            path.join(path.dirname(bundlePath), 'js-modules/UNBUNDLE')
          )
        ).toBeTruthy();
      }
      assertAssets(bundlePath);
    });
  }
}
