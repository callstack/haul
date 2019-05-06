declare module 'metro/src/shared/output/RamBundle/magic-number' {
  type MAGIC_NUMBER = number;
  const VALUE: MAGIC_NUMBER;
  export default VALUE;
}

declare module 'metro/src/lib/RamBundleParser' {
  export default class RamBundleParser {
    constructor(buffer: Buffer);
    getStartupCode(): string;
    getModule(id: number): string;
  }
}
