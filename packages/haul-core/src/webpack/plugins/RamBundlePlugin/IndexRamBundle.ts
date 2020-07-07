import MAGIC_NUMBER from 'metro/src/shared/output/RamBundle/magic-number';
import webpack from 'webpack';
import { RawSource } from 'webpack-sources';
import { Module } from './RamBundlePlugin';

/***
 * Reference: https://github.com/facebook/metro/blob/master/packages/metro/src/shared/output/RamBundle/as-indexed-file.js
 */

const NULL_TERMINATOR = Buffer.alloc(1).fill(0);
const UNIT32_SIZE = 4;

type ModuleBuffer = {
  id: number;
  buffer: Buffer;
};

export class IndexRamBundle {
  encoding: 'ascii' | 'utf16le' | 'utf8' = 'utf8';
  header: Buffer = Buffer.alloc(4);
  bootstrap: Buffer = Buffer.alloc(0);
  toc: Buffer = Buffer.alloc(0);
  modules: ModuleBuffer[] = [];
  rawModules: Module[] = [];

  constructor(
    bootstrap: string,
    modules: Module[],
    public sourceMap: boolean = false
  ) {
    this.bootstrap = this.toNullTerminatedBuffer(bootstrap);
    this.rawModules = modules;
    this.modules = modules.map(m => ({
      id: typeof m.id === 'string' ? m.idx : m.id,
      buffer: this.toNullTerminatedBuffer(m.source),
    }));
    this.header.writeUInt32LE(MAGIC_NUMBER, 0);
  }

  private toNullTerminatedBuffer(body: string) {
    return Buffer.concat([Buffer.from(body, this.encoding), NULL_TERMINATOR]);
  }

  private getOffset(n: number) {
    return (2 + n * 2) * UNIT32_SIZE;
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

  build({
    outputDest,
    outputFilename,
    sourceMapFilename,
    compilation,
  }: {
    outputDest: string;
    outputFilename: string;
    sourceMapFilename: string;
    compilation: webpack.compilation.Compilation;
  }) {
    this.buildToc();

    const bundle = Buffer.concat(
      [this.header, this.toc, this.bootstrap].concat(
        this.modules.map(m => m.buffer)
      )
    );

    // Cast buffer to any to avoid mismatch of types. RawSource works not only on strings
    // but also on Buffers.
    compilation.assets[outputFilename] = new RawSource(bundle as any);

    if (this.sourceMap) {
      const indexMap = {
        version: 3,
        file: outputDest,
        sections: [] as Array<{
          offset: { line: number; column: number };
          map: Object;
        }>,
      };

      this.rawModules.forEach((sourceModule, index) => {
        indexMap.sections.push({
          offset: {
            line: index,
            column: 0,
          },
          map: sourceModule.map,
        });
      });

      compilation.assets[sourceMapFilename] = new RawSource(
        JSON.stringify(indexMap)
      );
    }
  }
}
