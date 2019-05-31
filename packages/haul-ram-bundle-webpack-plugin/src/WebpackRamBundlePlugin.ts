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
    hooks: webpack.compilation.CompilationHooks & {
      renderWithEntry: { call: Function };
    };
  };
  moduleTemplates: {
    javascript: webpack.compilation.ModuleTemplate & {
      render: Function;
    };
  };
};

type ModuleMappings = {
  modules: { [key: string]: number };
  chunks: { [key: string]: Array<number | string> };
};

type WebpackRamBundlePluginOptions = {
  sourceMap?: boolean;
  indexRamBundle?: boolean;
  platform: string;
  bundleName?: string;
  config?: RamBundleConfig;
};

const variableToString = (value: string | number) => {
  return typeof value === 'string' ? `"${value}"` : value.toString();
};

export default class WebpackRamBundlePlugin {
  name = 'WebpackRamBundlePlugin';

  modules: Module[] = [];
  sourceMap: boolean = false;
  config: RamBundleConfig = {};
  indexRamBundle: boolean = true;
  platform: string;
  bundleName?: string | number;

  constructor({
    sourceMap,
    config,
    indexRamBundle,
    platform,
    bundleName,
  }: WebpackRamBundlePluginOptions) {
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
    this.platform = platform;
    this.bundleName = bundleName || 0;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'WebpackRamBundlePlugin',
      compilation => {
        this.bundleName = compilation.outputOptions.library || this.bundleName;
      }
    );

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

        let mainId: string | number | undefined;
        let mainChunk: webpack.compilation.Chunk | undefined;

        (compilation.chunks as webpack.compilation.Chunk[]).forEach(chunk => {
          if (chunk.id === 'main' || chunk.name === 'main') {
            mainChunk = chunk;
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

        if (mainId === undefined) {
          throw new Error(
            "WebpackRamBundlePlugin: couldn't find main chunk's entry module id"
          );
        }
        if (!mainChunk) {
          throw new Error("WebpackRamBundlePlugin: couldn't find main chunk");
        }

        // Render modules to it's 'final' form with injected webpack variables
        // and wrapped with ModuleTemplate.
        this.modules = compilation.modules.map(webpackModule => {
          const renderedModule = compilation.moduleTemplates.javascript
            .render(
              webpackModule,
              compilation.dependencyTemplates,
              compilation.options
            )
            .sourceAndMap();

          const selfRegisterId = variableToString(webpackModule.id);

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

        // Bundle name should be either 0 or a string from webpack config,
        // set by `output.library` option.
        if (this.bundleName === undefined) {
          throw new Error(
            'WebpackRamBundlePlugin: Cannot determine bundle name'
          );
        }

        const indent = (line: string) => `/*****/  ${line}`;
        const bootstrap = fs.readFileSync(
          path.join(__dirname, '../runtime/bootstrap.js'),
          'utf8'
        );
        let bootstrapCode =
          `(${bootstrap.trim()})(this, ${variableToString(
            this.bundleName
          )}, ${variableToString(mainId)}, ${inspect(moduleMappings, {
            depth: null,
            maxArrayLength: null,
            breakLength: Infinity,
          })});`
            .split('\n')
            .map(indent)
            .join('\n') + '\n';

        // Enhance bootstrapCode with additional JS from plugins that hook
        // into `renderWithEntry` for example: webpack's `library` is used here to expose
        // bundle as a library.
        const renderWithEntryResults = compilation.mainTemplate.hooks.renderWithEntry.call(
          bootstrapCode,
          mainChunk,
          mainChunk.hash
        );
        if (typeof renderWithEntryResults === 'string') {
          bootstrapCode = renderWithEntryResults;
        } else if ('source' in renderWithEntryResults) {
          bootstrapCode = renderWithEntryResults.source();
        }

        const outputFilename = compilation.outputOptions.filename!;
        const outputDest = path.isAbsolute(outputFilename)
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
            indexRamBundle: this.indexRamBundle,
            sourceMap: this.sourceMap,
            outputDest,
            outputFilename,
          });
        }

        const bundle = this.indexRamBundle
          ? new IndexRamBundle(bootstrapCode, this.modules, this.sourceMap)
          : new FileRamBundle(bootstrapCode, this.modules, this.sourceMap);

        const assetRegex = ({
          ios: /assets\//,
          android: /drawable-.+\//,
          ...this.config.assetRegex,
        } as { [key: string]: RegExp | undefined })[this.platform];

        if (!assetRegex) {
          throw new Error(
            `Cannot create RAM bundle: unknown platform ${this.platform}`
          );
        }

        Object.keys(compilation.assets)
          // Skip assets files like images
          .filter(asset => !assetRegex.test(asset))
          .forEach(asset => {
            delete compilation.assets[asset];
          });

        bundle.build({
          outputDest,
          outputFilename,
          sourceMapFilename,
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
