import path from 'path';
import fs from 'fs';
import { installDeps } from '../../utils/common';
import { bundleForPlatform, cleanup } from '../../utils/bundle';
import { spawnSync } from 'child_process';

const BIN_PATH = path.resolve(
  __dirname,
  '../../../packages/haul-explore/bin/haul-explore.js'
);
const NYC_BIN = path.resolve(__dirname, '../../../node_modules/.bin/nyc');
const NYC_ARGS = [
  '--silent',
  '--no-clean',
  '--exclude-after-remap',
  'false',
  '--cwd',
  path.join(__dirname, '../../'),
];
const PROJECT_FIXTURE = path.join(
  __dirname,
  '../../../fixtures',
  'react_native_with_haul_0_60x'
);

const RESULT_PATH = path.join(PROJECT_FIXTURE, 'dist/output.json');

describe('test exploring ram bundle', () => {
  beforeAll(() => installDeps(PROJECT_FIXTURE));
  beforeEach(() => cleanup(PROJECT_FIXTURE));
  afterAll(() => cleanup(PROJECT_FIXTURE));

  it('should return correct results for ram android bundle', () => {
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, 'android', {
      ramBundle: true,
      dev: false,
    });
    const unbundleFilePath = path.join(
      path.dirname(bundlePath),
      'js-modules/UNBUNDLE'
    );
    const args = [unbundleFilePath, bundlePath + '.map', `--json`, RESULT_PATH];
    const result = spawnSync(NYC_BIN, [...NYC_ARGS, BIN_PATH, ...(args || [])]);

    expect(fs.existsSync(RESULT_PATH)).toBeTruthy();
    expect(result.stderr.length).toBe(0);

    const output = fs.readFileSync(RESULT_PATH);
    const resultJSON = JSON.parse(output.toString());
    const bundleInformation = resultJSON.results[0];

    expect(bundleInformation.totalBytes).toBeGreaterThan(0);
    expect(Object.keys(bundleInformation.files).length).toBeGreaterThan(0);
    expect(bundleInformation.bundleName).toEqual(path.basename(bundlePath));
  });

  it('should return correct results for ram ios bundle', () => {
    const bundlePath = bundleForPlatform(PROJECT_FIXTURE, 'ios', {
      ramBundle: true,
      dev: false,
    });
    const args = [bundlePath, bundlePath + '.map', `--json`, RESULT_PATH];
    const result = spawnSync(NYC_BIN, [...NYC_ARGS, BIN_PATH, ...(args || [])]);

    expect(result.stderr.length).toBe(0);
    expect(fs.existsSync(RESULT_PATH)).toBeTruthy();

    const output = fs.readFileSync(RESULT_PATH);
    const resultJSON = JSON.parse(output.toString());
    const bundleInformation = resultJSON.results[0];

    expect(bundleInformation.totalBytes).toBeGreaterThan(0);
    expect(Object.keys(bundleInformation.files).length).toBeGreaterThan(0);
    expect(bundleInformation.bundleName).toEqual(path.basename(bundlePath));
  });
});
