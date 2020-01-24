import path from 'path';
import fs from 'fs';
import { installDeps } from '../../utils/common';
import { bundleForPlatform, cleanup } from '../../utils/bundle';
import { runProcessSync } from '../../utils/runProcess';

const BIN_PATH = path.resolve(
  __dirname,
  '../../../packages/haul-explore/bin/haul-explore.js'
);
const PROJECT_FIXTURE = path.join(
  __dirname,
  '../../../fixtures',
  'react_native_with_haul_0_60x'
);

describe('test exploring bundle', () => {
  beforeAll(() => installDeps(PROJECT_FIXTURE));
  beforeEach(() => cleanup(PROJECT_FIXTURE));
  afterAll(() => cleanup(PROJECT_FIXTURE));

  it('should return correct results for standard android bundle', () => {
    const RESULT_PATH = path.join(PROJECT_FIXTURE, 'dist/output_android.json');
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, 'android', {
      dev: false,
    });
    const result = runProcessSync(PROJECT_FIXTURE, [
      BIN_PATH,
      bundlePath,
      bundlePath + '.map',
      `--json`,
      RESULT_PATH,
    ]);

    expect(result.stderr.length).toBe(0);
    expect(fs.existsSync(RESULT_PATH)).toBeTruthy();

    const output = fs.readFileSync(RESULT_PATH);
    const resultJSON = JSON.parse(output.toString());
    const bundleInformation = resultJSON.results[0];

    expect(bundleInformation.totalBytes).toBeGreaterThan(500 * 1024);
    expect(Object.keys(bundleInformation.files).length).toBeGreaterThan(320);
    expect(bundleInformation.bundleName).toEqual(bundlePath);
  });

  it('should return correct results for standard ios bundle', () => {
    const RESULT_PATH = path.join(PROJECT_FIXTURE, 'dist/output_ios.json');
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, 'ios', {
      dev: false,
    });
    const result = runProcessSync(PROJECT_FIXTURE, [
      BIN_PATH,
      bundlePath,
      bundlePath + '.map',
      `--json`,
      RESULT_PATH,
    ]);

    expect(result.stderr.length).toBe(0);
    expect(fs.existsSync(RESULT_PATH)).toBeTruthy();

    const output = fs.readFileSync(RESULT_PATH);
    const resultJSON = JSON.parse(output.toString());
    const bundleInformation = resultJSON.results[0];

    expect(bundleInformation.totalBytes).toBeGreaterThan(500 * 1024);
    expect(Object.keys(bundleInformation.files).length).toBeGreaterThan(320);
    expect(bundleInformation.bundleName).toEqual(bundlePath);
  });
});
