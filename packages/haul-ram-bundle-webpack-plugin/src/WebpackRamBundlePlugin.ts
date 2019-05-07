import assert from 'assert';
import nodeFs from 'fs';
import path from 'path';
import webpack from 'webpack';
import RamBundle from './RamBundle';
import terser from 'terser';
import { RamBundleConfig } from '@haul/core';

export type Module = {
  id: string | number;
  idx: number;
  filename: string;
  source: string;
};

type Compilation = webpack.compilation.Compilation & {
  moduleTemplate: any;
  options: webpack.Configuration;
  mainTemplate: webpack.compilation.MainTemplate & {
    renderBootstrap: Function;
  };
};

type FileSystem = {
  writeFileSync: (filename: string, data: string | Buffer) => void;
};

type WebpackRamBundlePluginOptions = {
  debug?: boolean;
  onResults?: Function;
  filename: string;
  fs?: FileSystem;
  config: RamBundleConfig;
};

export default class WebpackRamBundlePlugin {
  static applyConfigTweaks(config: webpack.Configuration) {
    return {
      ...config,
      optimization: {
        ...config.optimization,
        namedModules: false,
      },
    };
  }

  debugDir: string | undefined;
  filename: string = '';
  modules: Module[] = [];
  fs: FileSystem;
  config: RamBundleConfig;

  constructor({
    debug = false,
    filename,
    fs,
    config,
  }: WebpackRamBundlePluginOptions) {
    if (debug) {
      this.debugDir = path.resolve('webpack-ram-debug');
    }
    this.fs = fs || nodeFs;
    this.filename = filename;
    this.config = config;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.afterEmit.tap('WebpackRamBundlePlugin', _compilation => {
      // Cast compilation from @types/webpack to custom Compilation type
      // which contains additional properties.
      const compilation: Compilation = _compilation as any;

      const moduleMappings: {
        modules: { [key: string]: number };
        chunks: { [key: string]: Array<number | string> };
      } = {
        modules: {},
        chunks: {},
      };

      let mainId;

      (compilation.chunks as webpack.compilation.Chunk[]).forEach(chunk => {
        if (chunk.id === 'main' || chunk.name === 'main') {
          mainId = chunk.entryModule.id;
        }

        chunk.getModules().forEach((moduleInChunk: { id: string | number }) => {
          moduleMappings.chunks[chunk.id] = ([] as Array<string | number>)
            .concat(...(moduleMappings.chunks[chunk.id] || []))
            .concat(moduleInChunk.id);
        });
      });

      assert(mainId !== undefined, "Couldn't find mainId");

      // Render modules to it's 'final' form with injected webpack variables
      // and wrapped with ModuleTemplate.
      this.modules = compilation.modules.map(webpackModule => {
        const renderedModule = compilation.moduleTemplate
          .render(
            webpackModule,
            compilation.dependencyTemplates,
            compilation.options
          )
          .sourceAndMap();

        const selfRegisterId =
          typeof webpackModule.id === 'string'
            ? `"${webpackModule.id}"`
            : webpackModule.id;

        if (typeof webpackModule.id === 'string') {
          moduleMappings.modules[webpackModule.id] = webpackModule.index;
        }

        // const sourceMaps = Buffer.from(
        //   JSON.stringify(renderedModule.map),
        //   'utf-8'
        // ).toString('base64');
        // const sourceMapsComment = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${sourceMaps}\n})`;
        // Minify source of module
        // TODO - source map https://github.com/terser-js/terser#source-map-options
        const minifiedSource = terser.minify(
          `__webpack_require__.loadSelf(
          ${selfRegisterId}, ${
            renderedModule.source /* .replace(
          /}\)$/gm,
          sourceMapsComment
        ) */
          });`,
          this.config.minification
        );

        // Check if there is no error in minifed source
        assert(!minifiedSource.error, minifiedSource.error);

        return {
          id: webpackModule.id,
          idx: webpackModule.index,
          filename: webpackModule.resource,
          source: minifiedSource.code || '',
        };
      });

      // Sanity check
      const duplicatedModule = this.modules.find(m1 =>
        this.modules.some(
          m2 => m1.filename !== m2.filename && m1.idx === m2.idx
        )
      );
      assert(
        !duplicatedModule,
        `Module with the same idx found: idx=${
          duplicatedModule ? duplicatedModule.idx : -1
        }; filename=${duplicatedModule ? duplicatedModule.filename : ''}`
      );

      const indent = (line: string) => `/*****/  ${line}`;
      const bootstrap = nodeFs.readFileSync(
        path.join(__dirname, '../runtime/bootstrap.js'),
        'utf8'
      );
      const bootstrapCode =
        `(${bootstrap.trim()})(this, ${
          typeof mainId === 'string' ? `"${mainId}"` : mainId
        }, JSON.parse('${JSON.stringify(moduleMappings)}'));`
          .split('\n')
          .map(indent)
          .join('\n') + '\n';

      if (this.debugDir) {
        const manifest = {
          modulesLength: this.modules.length,
          modules: this.modules.map(m => ({
            id: m.id,
            idx: m.idx,
            filename: m.filename,
          })),
        };
        this.fs.writeFileSync(
          path.join(this.debugDir, 'manifest.json'),
          JSON.stringify(manifest, null, '  ')
        );
        this.fs.writeFileSync(
          path.join(this.debugDir, 'bootstrap.js'),
          bootstrapCode
        );
        this.fs.writeFileSync(
          path.join(this.debugDir, 'modules.js'),
          this.modules.map(m => m.source).join('\n\n')
        );
      }

      const outputFilename = path.isAbsolute(this.filename)
        ? this.filename
        : path.join(compilation.outputOptions.path, this.filename);
      const bundle = new RamBundle();
      this.fs.writeFileSync(
        outputFilename,
        bundle.build(bootstrapCode, this.modules)
      );
    });
  }
}
