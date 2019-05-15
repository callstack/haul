import path from 'path';

export default function getReactNativeVersion(cwd: string): string | null {
  try {
    const { version } = require(path.join(
      cwd,
      'node_modules/react-native/package.json'
    ));

    return version;
  } catch (e) {
    return null;
  }
}
