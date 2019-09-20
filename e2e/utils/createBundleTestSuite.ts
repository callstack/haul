import path from 'path';
import fs from 'fs';
import { installDeps } from './common';
import { bundleForPlatform, cleanup } from './bundle';

export default function createBundleTestSuite(
  projectName: string,
  platform: string
) {
  const PROJECT_FIXTURE = path.join(__dirname, '../../fixtures', projectName);

  beforeAll(() => installDeps(PROJECT_FIXTURE));
  beforeEach(() => cleanup(PROJECT_FIXTURE, platform));
  afterAll(() => cleanup(PROJECT_FIXTURE, platform));

  test(`bundle ${platform} project`, () => {
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, platform);
    expect(fs.existsSync(bundlePath)).toBeTruthy();
  });
}
