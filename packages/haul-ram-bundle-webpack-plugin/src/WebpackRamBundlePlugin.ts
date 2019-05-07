import assert from 'assert';
import nodeFs from 'fs';
import path from 'path';
import webpack from 'webpack';
import terser from 'terser';
import mkdirp from 'mkdirp';
import RamBundle from './RamBundle';
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
  filename: string;
  fs?: FileSystem;
  config?: RamBundleConfig;
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

  filename: string = '';
  modules: Module[] = [];
  fs: FileSystem;
  config: RamBundleConfig = {};

  constructor({ filename, fs, config }: WebpackRamBundlePluginOptions) {
    if (config) {
      this.config = config;
      if (config.debug) {
        this.config.debug = {
          ...config.debug,
          path: path.resolve(config.debug.path),
        };
      }
    }
    this.fs = fs || nodeFs;
    this.filename = filename;
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

        let code = `__webpack_require__.loadSelf(
          ${selfRegisterId}, ${renderedModule.source});`;
        if (this.config.minification !== false) {
          // Minify source of module
          // TODO - source map https://github.com/terser-js/terser#source-map-options
          const minifiedSource = terser.minify(
            `__webpack_require__.loadSelf(
            ${selfRegisterId}, ${renderedModule.source});`,
            typeof this.config.minification === 'boolean'
              ? undefined
              : this.config.minification
          );

          // Check if there is no error in minifed source
          assert(!minifiedSource.error, minifiedSource.error);

          code = minifiedSource.code || '';
        }
        return {
          id: webpackModule.id,
          idx: webpackModule.index,
          filename: webpackModule.resource,
          source: code,
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

      if (this.config.debug) {
        mkdirp.sync(this.config.debug.path);
        const manifest = {
          filename: this.filename,
          config: this.config,
          module: {
            mappings: moduleMappings,
            count: this.modules.length,
            stats: this.modules.map(m => ({
              id: m.id,
              idx: m.idx,
              filename: m.filename,
              length: m.source.length,
            })),
          },
        };
        nodeFs.writeFileSync(
          path.join(this.config.debug.path, 'manifest.json'),
          JSON.stringify(manifest, null, '  ')
        );
        if (this.config.debug.renderBootstrap) {
          nodeFs.writeFileSync(
            path.join(this.config.debug.path, 'bootstrap.js'),
            bootstrapCode
          );
        }
        if (this.config.debug.renderModules) {
          nodeFs.writeFileSync(
            path.join(this.config.debug.path, 'modules.js'),
            this.modules
              .map(
                m =>
                  `/*** module begin: ${m.filename} ***/\n${
                    m.source
                  }\n/*** module end: ${m.filename} ***/`
              )
              .join('\n\n')
          );
        }
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
