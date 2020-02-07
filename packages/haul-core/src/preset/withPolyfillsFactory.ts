type Options = {
  initializeCoreLocation?: string;
};

export default function withPolyfillsFactory(polyfills: string[]) {
  return function withPolyfills(
    entry: string | string[],
    {
      initializeCoreLocation = 'react-native/Libraries/Core/InitializeCore.js',
    }: Options = {}
  ): { files: string[]; initializeCoreLocation: string } {
    const entryPrefix = [...polyfills, initializeCoreLocation];
    if (typeof entry === 'string') {
      return {
        initializeCoreLocation,
        files: [...entryPrefix, entry],
      };
    } else if (Array.isArray(entry)) {
      return {
        initializeCoreLocation,
        files: [...entryPrefix, ...entry],
      };
    } else {
      throw new Error(`${typeof entry} is not supported as a entry`);
    }
  };
}
