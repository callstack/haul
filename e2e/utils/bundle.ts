import { runHaulSync } from './runHaul';
import path from 'path';
import rimraf from 'rimraf';

export function bundleForPlatform(
  projectDir: string,
  platform: string,
  { ramBundle }: { ramBundle?: boolean } = {}
) {
  const bundlePath = path.resolve(
    projectDir,
    'dist',
    platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle'
  );
  const { stdout } = runHaulSync(projectDir, [
    ramBundle ? 'ram-bundle' : 'bundle',
    '--platform',
    platform,
    '--bundle-output',
    bundlePath,
    '--assets-dest',
    path.resolve(projectDir, 'dist'),
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }

  return bundlePath;
}

export function cleanup(projectDir: string) {
  rimraf.sync(path.resolve(projectDir, 'dist'));
}
