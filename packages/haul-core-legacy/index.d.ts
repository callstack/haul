declare module '@haul-bundler/core-legacy/build/commands/init' {
  const legacyCommand: {
    action: Function;
  };
  export default legacyCommand;
}

declare module '@haul-bundler/core-legacy/build/commands/reload' {
  const legacyCommand: {
    action: Function;
  };
  export default legacyCommand;
}

declare module '@haul-bundler/core-legacy/build/commands/start' {
  type StartCommandOptions = {
    port: number;
    no_interactive?: boolean;
    config: string;
    assetsDest?: string;
    dev: boolean;
    minify: boolean;
    eager?: boolean | string[];
    hotReloading: boolean;
  };

  const legacyCommand: {
    action: (options: StartCommandOptions) => Promise<void>;
  };
  export default legacyCommand;
}

declare module '@haul-bundler/core-legacy/build/constants' {
  export const DEFAULT_PORT: number;
  export const DEFAULT_CONFIG_FILENAME: string;
  export const INTERACTIVE_MODE_DEFAULT: boolean;
}

declare module '@haul-bundler/core-legacy/build/utils/getEntryFiles' {
  export default function getEntryFiles(entry: string[]): string;
}

declare module '@haul-bundler/core-legacy/build/utils/getConfig' {
  import webpack from 'webpack';

  export default function getConfig(...args: any[]): webpack.Configuration;
}

declare module '@haul-bundler/core-legacy/build/utils/getWebpackConfigPath' {
  export default function getWebpackConfigPath(
    dir: string,
    userConfig?: string
  ): string;
}

declare module '@haul-bundler/core-legacy/build/resolvers/AssetResolver' {
  export default class AssetResolver {
    static test: RegExp;
    constructor(options: any);
  }
}

declare module '@haul-bundler/core-legacy/build/resolvers/HasteResolver' {
  export default class HasteResolver {
    constructor(options: any);
  }
}

declare module '@haul-bundler/core-legacy/build/utils/resolveModule' {
  export default function moduleResolve(root: string, name: string): string;
}

declare module '@haul-bundler/core-legacy/build/utils/makeReactNativeConfig' {
  export function injectPolyfillIntoEntry(options: any): string[];
}

declare module '@haul-bundler/core-legacy' {
  type EnvOptions = ConfigOptions & {
    platform: string;
  };
  type WebpackConfigFactory =
    | ((opts: EnvOptions) => WebpackConfig)
    | WebpackConfig;
  type WebpackEntry = string | Array<string> | Object;
  type ConfigOptions = {
    root: string;
    assetsDest: string;
    dev: boolean;
    minify?: boolean;
    bundle?: boolean;
    port?: number;
    providesModuleNodeModules?: (
      | string
      | { name: string; directory: string })[];
    hasteOptions?: any;
    initializeCoreLocation?: string;
    disableHotReloading?: boolean;
  };

  type WebpackConfig = {
    entry: WebpackEntry;
    output: {
      path: string;
      filename: string;
    };
    name?: string;
    plugins: Function[];
    context: string;
    optimization: {
      minimize: boolean;
      minimizer: Function[];
      namedModules: boolean;
      concatenateModules: boolean;
    };
    stats: string;
  };

  export function createWebpackConfig(
    configBuilder: WebpackConfigFactory
  ): (options: EnvOptions) => Object;
}
