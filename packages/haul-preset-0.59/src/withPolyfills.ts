import path from 'path';

// JS polyfills for JSC
// Temporary backport of https://github.com/facebook/react-native/blob/v0.55.3/rn-get-polyfills.js
// TODO: revisit polyfills and check if we need them, since starting from RN 0.59+ we have newer JSC
const polyfills = [
  require.resolve('./vendor/polyfills/Object.es6.js'),
  require.resolve('./vendor/polyfills/console.js'),
  require.resolve('./vendor/polyfills/error-guard.js'),
  require.resolve('./vendor/polyfills/Number.es6.js'),
  require.resolve('./vendor/polyfills/String.prototype.es6.js'),
  require.resolve('./vendor/polyfills/Array.prototype.es6.js'),
  require.resolve('./vendor/polyfills/Array.es6.js'),
  require.resolve('./vendor/polyfills/Object.es7.js'),
  require.resolve('./vendor/polyfills/babelHelpers.js'),
];

type Options = {
  root?: string;
  initializeCoreLocation?: string;
};

export default function withPolyfills(
  entry: string | string[],
  {
    root = '',
    initializeCoreLocation = 'node_modules/react-native/Libraries/Core/InitializeCore.js',
  }: Options = {}
): string[] {
  const entryPrefix = [...polyfills, path.join(root, initializeCoreLocation)];

  if (typeof entry === 'string') {
    return [...entryPrefix, entry];
  } else if (Array.isArray(entry)) {
    return [...entryPrefix, ...entry];
  } else {
    throw new Error(`${typeof entry} is not supported as a entry`);
  }
}
