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
    public sourceMap: boolean,
    public bundleName: string,
    public singleBundleMode: boolean
  ) {}

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
    const jsModulesDir = this.singleBundleMode
      ? path.join(path.dirname(outputFilename), 'js-modules')
      : path.join(
          path.dirname(outputFilename),
          `${this.bundleName}-js-modules`
        );
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
      this.modules.forEach((sourceModule, index) => {
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
