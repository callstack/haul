import path from 'path';
import fs from 'fs';
import { installDeps, cleanup } from '../../../integration_tests/utils/common';
import { runHaulSync } from '../../../integration_tests/utils/runHaul';
import {
  validateBaseBundle,
  validateHostBundle,
  validateAppBundle,
} from '../../utils/bundles';

const PROJECT_FIXTURE = path.join(
  __dirname,
  '../../../fixtures/react_native_windows_current'
);

describe('react_native_windows_current', () => {
  beforeAll(() => {
    installDeps(PROJECT_FIXTURE);
  });

  afterAll(() => {
    cleanup(path.join(PROJECT_FIXTURE, 'dist/single'));
    cleanup(path.join(PROJECT_FIXTURE, 'dist/multi'));
  });

  it('should bundle for single Indexed RAM bundle', () => {
    const { stderr } = runHaulSync(PROJECT_FIXTURE, [
      'bundle',
      '--platform',
      'windows',
      '--dev',
      'false',
      '--minify',
      'false',
      '--bundle-output',
      'dist/single/index.windows.bundle',
      '--assets-dest',
      'dist/single',
    ]);

    expect(stderr.length).toBe(0);
    expect(
      fs.existsSync(
        path.join(PROJECT_FIXTURE, 'dist/single/index.windows.bundle')
      )
    ).toBe(true);
    const bundle = fs.readFileSync(
      path.join(PROJECT_FIXTURE, 'dist/single/index.windows.bundle')
    );
    validateBaseBundle(bundle);
  });

  it('should bundle for host, base_dll and apps bundles', () => {
    const { stderr } = runHaulSync(PROJECT_FIXTURE, [
      'multi-bundle',
      '--platform',
      'windows',
      '--dev',
      'false',
      '--minify',
      'false',
      '--bundle-output',
      'dist/multi',
      '--assets-dest',
      'dist/multi',
      '--config',
      'haul.config.multi.js',
    ]);

    expect(stderr.length).toBe(0);
    expect(
      fs.existsSync(
        path.join(PROJECT_FIXTURE, 'dist/multi/host.windows.bundle')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(PROJECT_FIXTURE, 'dist/multi/base_dll.windows.bundle')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(PROJECT_FIXTURE, 'dist/multi/app0.windows.bundle')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(PROJECT_FIXTURE, 'dist/multi/app1.windows.bundle')
      )
    ).toBe(true);
    const baseDllBundle = fs.readFileSync(
      path.join(PROJECT_FIXTURE, 'dist/multi/base_dll.windows.bundle')
    );
    const hostBundle = fs.readFileSync(
      path.join(PROJECT_FIXTURE, 'dist/multi/host.windows.bundle')
    );
    const app0Bundle = fs.readFileSync(
      path.join(PROJECT_FIXTURE, 'dist/multi/app0.windows.bundle')
    );
    const app1Bundle = fs.readFileSync(
      path.join(PROJECT_FIXTURE, 'dist/multi/app1.windows.bundle')
    );

    validateBaseBundle(baseDllBundle);
    validateHostBundle(hostBundle);
    validateAppBundle(app0Bundle);
    validateAppBundle(app1Bundle);
  });
});
