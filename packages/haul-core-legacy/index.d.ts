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

declare module '@haul-bundler/core-legacy/build/utils/getEntryFiles' {
  export default function getEntryFiles(entry: string[]): string;
}
