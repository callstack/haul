// @ts-ignore
import { runHaulSync } from './runHaul';
import path from 'path';
import rimraf from 'rimraf';

export function bundleForPlatform(projectDir: string, platform: string) {
  const bundlePath = path.resolve(
    projectDir,
    platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle'
  );
  const { stdout } = runHaulSync(projectDir, [
    'bundle',
    '--platform',
    platform,
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }

  return bundlePath;
}

export function cleanup(projectDir: string, platform: string) {
  const filename =
    platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle';
  rimraf.sync(path.resolve(projectDir, filename));
  rimraf.sync(path.resolve(projectDir, `${filename}.map`));
}
