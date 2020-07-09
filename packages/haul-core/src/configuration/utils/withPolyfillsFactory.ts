type Options = {
  initializeCoreLocation?: string;
  additionalSetupFiles?: string[];
};

export function withPolyfillsFactory(polyfills: string[]) {
  return function withPolyfills(
    entry: string | string[],
    {
      additionalSetupFiles = [],
      initializeCoreLocation = 'react-native/Libraries/Core/InitializeCore.js',
    }: Options = {}
  ): { entryFiles: string[]; setupFiles: string[] } {
    const setupFiles = [...polyfills, initializeCoreLocation];

    if (typeof entry === 'string') {
      return {
        setupFiles: [...setupFiles, ...additionalSetupFiles],
        entryFiles: [...setupFiles, entry],
      };
    } else if (Array.isArray(entry)) {
      return {
        setupFiles: [...setupFiles, ...additionalSetupFiles],
        entryFiles: [...setupFiles, ...entry],
      };
    } else {
      throw new Error(`${typeof entry} is not supported as a entry`);
    }
  };
}
