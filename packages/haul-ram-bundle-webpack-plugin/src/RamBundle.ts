import MAGIC_NUMBER from 'metro/src/shared/output/RamBundle/magic-number';
import { Module } from './WebpackRamBundlePlugin';

/***
 * Reference: https://github.com/facebook/metro/blob/master/packages/metro/src/shared/output/RamBundle/as-indexed-file.js
 */

const NULL_TERMINATOR = Buffer.alloc(1).fill(0);
const UNIT32_SIZE = 4;

const countLines = (string: string) =>
  (string.match(/\r\n?|\n|\u2028|\u2029/g) || []).length;

type ModuleBuffer = {
  id: number;
  buffer: Buffer;
};

export default class RamBundle {
  encoding: 'ascii' | 'utf16le' | 'utf8' = 'utf8';
  header: Buffer = Buffer.alloc(4);
  bootstrap: Buffer = Buffer.alloc(0);
  toc: Buffer = Buffer.alloc(0);
  modules: ModuleBuffer[] = [];

  constructor() {
    this.header.writeUInt32LE(MAGIC_NUMBER, 0);
  }

  private toNullTerminatedBuffer(body: string) {
    return Buffer.concat([Buffer.from(body, this.encoding), NULL_TERMINATOR]);
  }

  private getOffset(n: number) {
    return (2 + n * 2) * UNIT32_SIZE;
  }

  private buildModules(modules: Module[]) {
    this.modules = modules.map(m => ({
      id: typeof m.id === 'string' ? m.idx : m.id,
      buffer: this.toNullTerminatedBuffer(m.source),
    }));
  }

  private buildToc() {
    const maxModuleId = Math.max(...this.modules.map(m => m.id));
    const entriesLength = maxModuleId + 1;
    const table = Buffer.alloc(this.getOffset(entriesLength)).fill(0);

    table.writeUInt32LE(entriesLength, 0);
    table.writeUInt32LE(this.bootstrap.length, UNIT32_SIZE);

    let codeOffset = this.bootstrap.length;
    this.modules.forEach(moduleBuffer => {
      const offset = this.getOffset(moduleBuffer.id);
      table.writeUInt32LE(codeOffset, offset);
      table.writeUInt32LE(moduleBuffer.buffer.length, offset + UNIT32_SIZE);
      codeOffset += moduleBuffer.buffer.length;
    });

    this.toc = table;
  }

  build(
    bootstraper: string,
    modules: Module[],
    filename: string,
    sourceMap: boolean
  ): { bundle: Buffer; sourceMap: Object } {
    this.bootstrap = this.toNullTerminatedBuffer(bootstraper);
    this.buildModules(modules);
    this.buildToc();

    const bundle = Buffer.concat(
      [this.header, this.toc, this.bootstrap].concat(
        this.modules.map(m => m.buffer)
      )
    );

    if (sourceMap) {
      const indexMap = {
        version: 3,
        file: filename,
        sections: [] as Array<{
          offset: { line: number; column: number };
          map: Object;
        }>,
      };

      const bundleParts = bundle.toString().split('\n');
      let lineOffset =
        bundleParts.findIndex(line =>
          line.includes('__webpack_require__.loadSelf(')
        ) + 1;
      modules.forEach(sourceModule => {
        indexMap.sections.push({
          offset: {
            line: lineOffset,
            column:
              bundleParts[lineOffset - 1].indexOf(
                '__webpack_require__.loadSelf('
              ) + 1,
          },
          map: sourceModule.map,
        });

        lineOffset += countLines(sourceModule.source);
      });

      return {
        bundle,
        sourceMap: indexMap,
      };
    }

    return {
      bundle,
      sourceMap: {},
    };
  }
}
