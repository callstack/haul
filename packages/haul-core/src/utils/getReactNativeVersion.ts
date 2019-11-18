import path from 'path';
import semver from 'semver';

export default function getReactNativeVersion(
  cwd: string
): semver.SemVer | undefined {
  const { version } = require(path.join(
    cwd,
    'node_modules/react-native/package.json'
  ));

  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return undefined;
  }

  return parsedVersion;
}
