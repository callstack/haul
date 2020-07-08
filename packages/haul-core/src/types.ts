export type Mode = 'dev' | 'prod' | 'development' | 'production';
export type SourceMap = boolean | 'inline';
export type BundlingMode = 'single-bundle' | 'multi-bundle';
export type RamBundleType = 'indexed-ram-bundle' | 'file-ram-bundle';
export type BundleFormat = 'basic-bundle' | RamBundleType;
export type BundleType = 'dll' | 'app' | 'default';
export type BundleOutputType = 'file' | 'server';
export type LooseModeConfig =
  | boolean
  | Array<string | RegExp>
  | ((filename: string) => boolean);
