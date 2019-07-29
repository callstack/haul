import path from 'path';
import fs from 'fs';
import { run, yarnCommand } from '../../utils/common';
import { bundleForPlatform, cleanup } from '../../utils/bundle';

const TEST_PROJECT_DIR = path.join(
  __dirname,
  '../../../fixtures/react_native_with_haul_0_60x'
);

beforeAll(() => run(`${yarnCommand} --mutex network`, TEST_PROJECT_DIR));
beforeEach(() => cleanup(TEST_PROJECT_DIR, 'ios'));
afterAll(() => cleanup(TEST_PROJECT_DIR, 'ios'));

test('bundle ios project', () => {
  const bundlePath = bundleForPlatform(TEST_PROJECT_DIR, 'ios');
  expect(fs.existsSync(bundlePath)).toBeTruthy();
});
