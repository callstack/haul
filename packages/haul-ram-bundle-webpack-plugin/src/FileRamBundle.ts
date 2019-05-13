import webpack from 'webpack';
import path from 'path';
import { RawSource } from 'webpack-sources';
import MAGIC_NUMBER from 'metro/src/shared/output/RamBundle/magic-number';
import { Module } from './WebpackRamBundlePlugin';
import { countLines } from './utils';

export default class FileRamBundle {
  constructor(
    public bootstrap: string,
    public modules: Module[],
    public sourceMap: boolean = false
  ) {}

  build({
    outputDest,
    outputFilename,
    compilation,
  }: {
    outputDest: string;
    outputFilename: string;
    compilation: webpack.compilation.Compilation;
  }) {
    const jsModulesDir = path.join(path.dirname(outputFilename), 'js-modules');
    // UNBUNDLE file tells React Native it's a RAM bundle.
    const UNBUNDLE = Buffer.alloc(4);
    UNBUNDLE.writeUInt32LE(MAGIC_NUMBER, 0);

    // Bundle file contains only bootstrap code. Modules are stored in `js-modules`
    // in the same directory as bundle file.
    compilation.assets[outputFilename] = new RawSource(this.bootstrap);
    // Cast buffer to any to avoid mismatch of types. RawSource works not only on strings
    // but also on Buffers.
    compilation.assets[path.join(jsModulesDir, 'UNBUNDLE')] = new RawSource(
      UNBUNDLE as any
    );

    // Emit JS modules
    this.modules.forEach(webpackModule => {
      const intId =
        typeof webpackModule.id === 'string'
          ? webpackModule.idx
          : webpackModule.id;
      compilation.assets[
        path.join(jsModulesDir, `${intId}.js`)
      ] = new RawSource(webpackModule.source);
    });

    if (this.sourceMap) {
      const indexMap = {
        version: 3,
        file: outputDest,
        sections: [] as Array<{
          offset: { line: number; column: number };
          map: Object;
        }>,
      };
      let lineOffset = countLines(this.bootstrap);
      this.modules.forEach(sourceModule => {
        indexMap.sections.push({
          offset: {
            line: lineOffset,
            column: 0,
          },
          map: sourceModule.map,
        });
        lineOffset += countLines(sourceModule.source);
      });

      const sourceMapFilename = compilation.getPath(
        compilation.outputOptions.sourceMapFilename,
        {
          filename: path.isAbsolute(outputFilename)
            ? path.relative(compilation.context, outputFilename)
            : outputFilename,
        }
      );

      compilation.assets[sourceMapFilename] = new RawSource(
        JSON.stringify(indexMap)
      );
    }
  }
}
