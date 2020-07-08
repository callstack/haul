export type BundlingMode = 'single-bundle' | 'multi-bundle';
export type RamBundleType = 'indexed-ram-bundle' | 'file-ram-bundle';
export type BundleType = 'basic-bundle' | RamBundleType;
export type LooseModeConfig =
  | boolean
  | Array<string | RegExp>
  | ((filename: string) => boolean);
