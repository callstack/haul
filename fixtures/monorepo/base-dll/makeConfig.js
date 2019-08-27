import { join } from 'path';

export default function makeConfig(copyBundle = false) {
  return ({ platform, bundleTarget, dev }) => {
    const basePath = join(
      __dirname,
      `./dist/${platform}/${dev ? 'dev' : 'prod'}`
    );
    const filename = `base_dll${
      bundleTarget === 'server' ? '_server' : ''
    }${
      platform === 'ios' ? '.jsbundle' : '.android.bundle'
    }`;
    return {
    dll: true,
    copyBundle,
    bundlePath: join(basePath, filename),
    manifestPath: join(basePath, 'base_dll.manifest.json'),
    }
  };
}