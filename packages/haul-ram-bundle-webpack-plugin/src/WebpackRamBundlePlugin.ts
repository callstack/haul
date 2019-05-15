import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { inspect } from 'util';
import webpack from 'webpack';
import terser from 'terser';
import mkdirp from 'mkdirp';
import { RamBundleConfig } from '@haul-bundler/core';
import IndexRamBundle from './IndexRamBundle';
import FileRamBundle from './FileRamBundle';

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
  indexRamBundle?: boolean;
  config?: RamBundleConfig;
};

export default class WebpackRamBundlePlugin {
  name = 'WebpackRamBundlePlugin';

  modules: Module[] = [];
  sourceMap: boolean = false;
  config: RamBundleConfig = {};
  indexRamBundle: boolean = true;

  constructor({
    sourceMap,
    config,
    indexRamBundle,
  }: WebpackRamBundlePluginOptions = {}) {
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
    this.indexRamBundle = Boolean(indexRamBundle);
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

          let code = `__haul.l(${selfRegisterId}, ${renderedModule.source});`;
          let map = renderedModule.map;
          const { enabled = false, ...minifyOptions } =
            this.config.minification || {};
          if (enabled) {
            const minifiedSource = terser.minify(code, {
              ...minifyOptions,
              sourceMap: {
                content: renderedModule.map,
              },
            });
            // Check if there is no error in minifed source
            assert(!minifiedSource.error, minifiedSource.error);

            code = minifiedSource.code || '';
            if (typeof minifiedSource.map === 'string') {
              map = JSON.parse(minifiedSource.map);
            }
          }

          return {
            id: webpackModule.id,
            idx: webpackModule.index,
            filename: webpackModule.resource,
            source: code,
            map: {
              ...map,
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
        const outputDest = path.isAbsolute(outputFilename)
          ? outputFilename
          : path.join(compilation.outputOptions.path, outputFilename);

        if (this.config.debug) {
          this.generateDebugFiles(moduleMappings, bootstrapCode, {
            indexRamBundle: this.indexRamBundle,
            sourceMap: this.sourceMap,
            outputDest,
            outputFilename,
          });
        }

        const bundle = this.indexRamBundle
          ? new IndexRamBundle(bootstrapCode, this.modules, this.sourceMap)
          : new FileRamBundle(bootstrapCode, this.modules, this.sourceMap);

        Object.keys(compilation.assets)
          // Skip assets files like images, which will always be in assets/ directory
          .filter(asset => !/assets\//.test(asset))
          .forEach(asset => {
            delete compilation.assets[asset];
          });

        bundle.build({
          outputDest,
          outputFilename,
          compilation,
        });
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
