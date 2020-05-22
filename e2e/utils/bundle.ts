import { runHaulSync } from './runHaul';
import path from 'path';
import fetch from 'node-fetch';
import rimraf from 'rimraf';

export function bundleForPlatform(
  projectDir: string,
  platform: string,
  { ramBundle, dev = true }: { ramBundle?: boolean; dev?: boolean } = {}
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
    '--dev',
    dev ? 'true' : 'false',
    '--max-workers',
    '1',
    '--progress',
    'none',
  ]);

  if (stdout.match(/(error ▶︎ |ERROR)/g)) {
    throw new Error(stdout);
  }
  return bundlePath;
}

export function cleanup(projectDir: string) {
  rimraf.sync(path.resolve(projectDir, 'dist'));
}

export async function fetchBundle(
  port: number,
  platform: string,
  options?: { minify?: boolean; dev?: boolean }
) {
  let builtOptions = '';
  if (options) {
    const queryBundleOptions = [
      options.dev !== undefined ? { name: 'dev', value: options.dev } : null,
      options.minify !== undefined
        ? { name: 'minify', value: options.minify }
        : null,
    ]
      .filter(Boolean)
      .map(option => `${option!.name}=${option!.value}`)
      .join('&');
    builtOptions = `?${queryBundleOptions}`;
  }

  const response = await fetch(
    `http://localhost:${port}/index.${platform}.bundle${builtOptions}`
  );

  return { bundle: await response.buffer(), response };
}
