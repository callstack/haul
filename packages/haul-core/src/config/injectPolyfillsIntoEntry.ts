import path from 'path';
import webpack from 'webpack';

// JS polyfills for JSC
// Temporary backport of https://github.com/facebook/react-native/blob/v0.55.3/rn-get-polyfills.js
const polyfills = [
  require.resolve('../vendor/polyfills/Object.es6.js'),
  require.resolve('../vendor/polyfills/console.js'),
  require.resolve('../vendor/polyfills/error-guard.js'),
  require.resolve('../vendor/polyfills/Number.es6.js'),
  require.resolve('../vendor/polyfills/String.prototype.es6.js'),
  require.resolve('../vendor/polyfills/Array.prototype.es6.js'),
  require.resolve('../vendor/polyfills/Array.es6.js'),
  require.resolve('../vendor/polyfills/Object.es7.js'),
  require.resolve('../vendor/polyfills/babelHelpers.js'),
];

export default function injectPolyfillIntoEntry({
  entry: userEntry,
  root,
  initializeCoreLocation = 'node_modules/react-native/Libraries/Core/InitializeCore.js',
  dev = true,
  hotReloading = false,
}: {
  entry: webpack.Configuration['entry'];
  root: string;
  initializeCoreLocation?: string;
  dev?: boolean;
  hotReloading?: boolean;
}) {
  const reactNativeHaulEntries = [
    ...polyfills,
    require.resolve(path.join(root, initializeCoreLocation)),
  ];

  if (dev && hotReloading) {
    reactNativeHaulEntries.push(
      require.resolve('@haul-bundler/core-legacy/hot/patch.js')
    );
  }

  return makeWebpackEntry(userEntry, reactNativeHaulEntries);
}

function makeWebpackEntry(
  userEntry: webpack.Configuration['entry'],
  otherEntries: Array<string>
): webpack.Configuration['entry'] {
  if (typeof userEntry === 'string') {
    return [...otherEntries, userEntry];
  }
  if (Array.isArray(userEntry)) {
    return [...otherEntries, ...userEntry];
  }
  if (typeof userEntry === 'object') {
    const chunkNames = Object.keys(userEntry);
    return chunkNames.reduce(
      (entryObj: { [key: string]: string[] }, name: string) => {
        const chunk = userEntry[name];
        if (typeof chunk === 'string') {
          entryObj[name] = [...otherEntries, chunk];
          return entryObj;
        } else if (Array.isArray(chunk)) {
          entryObj[name] = [...otherEntries, ...chunk];
          return entryObj;
        }
        return chunk;
      },
      {}
    );
  }
  return userEntry;
}
