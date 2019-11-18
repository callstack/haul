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
    const entryPrefix = [...polyfills, initializeCoreLocation];
    if (typeof entry === 'string') {
      return [...entryPrefix, entry];
    } else if (Array.isArray(entry)) {
      return [...entryPrefix, ...entry];
    } else {
      throw new Error(`${typeof entry} is not supported as a entry`);
    }
  };
}
