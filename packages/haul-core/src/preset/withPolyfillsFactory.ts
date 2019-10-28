type Options = {
  initializeCoreLocation?: string;
};

export default function withPolyfillsFactory(polyfills: string[]) {
  return function withPolyfills(
    entry: string | string[],
    {
      initializeCoreLocation = 'react-native/Libraries/Core/InitializeCore.js',
    }: Options = {}
  ): string[] {
    const entryPrefix = [...polyfills];
    try {
      // Try resolving the location using standard `require.resolve`, otherwise fallback to webpack resolution.
      entryPrefix.push(require.resolve(initializeCoreLocation));
    } catch (error) {
      entryPrefix.push(initializeCoreLocation);
    }

    if (typeof entry === 'string') {
      return [...entryPrefix, entry];
    } else if (Array.isArray(entry)) {
      return [...entryPrefix, ...entry];
    } else {
      throw new Error(`${typeof entry} is not supported as a entry`);
    }
  };
}
