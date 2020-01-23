declare module 'metro/src/lib/RamBundleParser' {
  export default class RamBundleParser {
    constructor(buffer: Buffer);
    getStartupCode(): string;
    getModule(id: number): string;
  }
}
