import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { inspect } from 'util';
import webpack from 'webpack';
import { RawSource } from 'webpack-sources';
import terser from 'terser';
import mkdirp from 'mkdirp';
import RamBundle from './RamBundle';
import { RamBundleConfig } from '@haul/core';

export type Module = {
  id: string | number;
  idx: number;
  filename: string;
  source: string;
  map: Object;
};

type Compilation = webpack.compilation.Compilation & {
  moduleTemplate: any;
  options: webpack.Configuration;
  mainTemplate: webpack.compilation.MainTemplate & {
    renderBootstrap: Function;
  };
};

type ModuleMappings = {
  modules: { [key: string]: number };
  chunks: { [key: string]: Array<number | string> };
};

type WebpackRamBundlePluginOptions = {
  sourceMap?: boolean;
  config?: RamBundleConfig;
};

export default class WebpackRamBundlePlugin {
  name = 'WebpackRamBundlePlugin';

  modules: Module[] = [];
  sourceMap: boolean = false;
  config: RamBundleConfig = {};

  constructor({ sourceMap, config }: WebpackRamBundlePluginOptions = {}) {
    if (config) {
      this.config = config;
      if (config.debug) {
        this.config.debug = {
          ...config.debug,
          path: path.resolve(config.debug.path),
        };
      }
    }
    this.sourceMap = Boolean(sourceMap);
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapPromise(
      'WebpackRamBundlePlugin',
      async _compilation => {
        // Cast compilation from @types/webpack to custom Compilation type
        // which contains additional properties.
        const compilation: Compilation = _compilation as any;

        const moduleMappings: ModuleMappings = {
          modules: {},
          chunks: {},
        };

        let mainId;

        (compilation.chunks as webpack.compilation.Chunk[]).forEach(chunk => {
          if (chunk.id === 'main' || chunk.name === 'main') {
            mainId = chunk.entryModule.id;
          }

          chunk
            .getModules()
            .forEach((moduleInChunk: { id: string | number }) => {
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

          let code = `__webpack_require__.loadSelf(${selfRegisterId}, ${
            renderedModule.source
          });`;
          if (this.config.minification !== false) {
            // Minify source of module
            // TODO - source map https://github.com/terser-js/terser#source-map-options
            const minifiedSource = terser.minify(
              code,
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
            map: {
              ...renderedModule.map,
              file: `${
                typeof webpackModule.id === 'string'
                  ? webpackModule.index
                  : webpackModule.id
              }.js`,
            },
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
        const bootstrap = fs.readFileSync(
          path.join(__dirname, '../runtime/bootstrap.js'),
          'utf8'
        );
        const bootstrapCode =
          `(${bootstrap.trim()})(this, ${
            typeof mainId === 'string' ? `"${mainId}"` : mainId
          }, ${inspect(moduleMappings, {
            depth: null,
            maxArrayLength: null,
            breakLength: Infinity,
          })});`
            .split('\n')
            .map(indent)
            .join('\n') + '\n';

        const outputFilename = compilation.outputOptions.filename!;
        const outputFilePath = path.isAbsolute(outputFilename)
          ? outputFilename
          : path.join(compilation.outputOptions.path, outputFilename);
        const sourceMapFilename = compilation.getPath(
          compilation.outputOptions.sourceMapFilename,
          {
            filename: path.isAbsolute(outputFilename)
              ? path.relative(compilation.context, outputFilename)
              : outputFilename,
          }
        );

        if (this.config.debug) {
          this.generateDebugFiles(moduleMappings, bootstrapCode, {
            sourceMap: this.sourceMap,
            outputFilePath,
            sourceMapFilename,
            outputFilename,
          });
        }

        const ramBundle = new RamBundle();
        const { bundle, sourceMap } = ramBundle.build(
          bootstrapCode,
          this.modules,
          outputFilePath,
          this.sourceMap
        );

        Object.keys(compilation.assets).forEach(asset => {
          delete compilation.assets[asset];
        });
        // Cast buffer to any to avoid mismatch of types. RawSource works not only on strings
        // but also on Buffers.
        compilation.assets[outputFilename] = new RawSource(bundle as any);
        if (this.sourceMap) {
          compilation.assets[sourceMapFilename] = new RawSource(
            JSON.stringify(sourceMap)
          );
        }
      }
    );
  }

  generateDebugFiles(
    moduleMappings: ModuleMappings,
    bootstrapCode: string,
    extraData: Object
  ) {
    if (!this.config.debug) {
      return;
    }

    mkdirp.sync(this.config.debug.path);
    const manifest = {
      ...extraData,
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
    fs.writeFileSync(
      path.join(this.config.debug.path, 'manifest.json'),
      JSON.stringify(manifest, null, '  ')
    );
    if (this.config.debug.renderBootstrap) {
      fs.writeFileSync(
        path.join(this.config.debug.path, 'bootstrap.js'),
        bootstrapCode
      );
    }
    if (this.config.debug.renderModules) {
      fs.writeFileSync(
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
}
