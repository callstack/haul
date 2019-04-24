import assert from 'assert';
import nodeFs from 'fs';
import path from 'path';
import dedent from 'dedent';
import webpack from 'webpack';
import RamBundle from './RamBundle';

/**
 * TODO: support file paths as an ID and map it to idx
 * TODO: support imports
 * TODO: support other chunks
 */

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

  constructor({ debug = false, filename, fs }: WebpackRamBundlePluginOptions) {
    if (debug) {
      this.debugDir = path.resolve('webpack-ram-debug');
    }
    this.fs = fs || nodeFs;
    this.filename = filename;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.afterEmit.tap('WebpackRamBundlePlugin', _compilation => {
      // Cast compilation from @types/webpack to custom Compilation type
      // which contains additional properties.
      const compilation: Compilation = _compilation as any;

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

        const sourceMaps = Buffer.from(
          JSON.stringify(renderedModule.map),
          'utf-8'
        ).toString('base64');
        const sourceMapsComment = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${sourceMaps}\n})`;
        return {
          id: webpackModule.id,
          idx: webpackModule.index,
          filename: webpackModule.resource,
          source: `__webpack_require__.sr(
            ${selfRegisterId}, ${renderedModule.source.replace(
            /}\)$/gm,
            sourceMapsComment
          )});`,
        };
      });

      // Sanity check
      let duplicatedModule = this.modules.find(m1 =>
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

      const webpackBootstrapper = compilation.mainTemplate
        .renderBootstrap(
          compilation.hash,
          compilation.chunks[0],
          compilation.moduleTemplate,
          compilation.dependencyTemplates
        )
        .reduce((acc: string[], line: string) => {
          return acc.concat(
            ...line
              .replace(
                '__webpack_require__.m = modules;',
                '__webpack_require__.m = {};'
              )
              .replace(
                'function __webpack_require__',
                'function __original_webpack_require__'
              )
              .split('\n')
          );
        }, []);

      const customBootstrapper = dedent`
      /*** BEGIN: CUSTOM BOOTSTRAPPER ***/

      var ID_MASK_SHIFT = 16;
      var LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;

      function unpackModuleId(moduleId) {
        var segmentId = moduleId >>> ID_MASK_SHIFT;
        var localId = moduleId & LOCAL_ID_MASK;
        return {
          segmentId: segmentId,
          localId: localId
        };
      }

      function __webpack_require__(moduleId) {
        // Check if module is in cache
        if (installedModules[moduleId]) {
          return installedModules[moduleId].exports;
        }

        // Create a new module (and put it into the cache)
        var module = installedModules[moduleId] = {
          i: moduleId,
          l: false,
          exports: {}
        }

        // Load module on the native side
        var unpackedModule = unpackModuleId(moduleId);
        global.nativeRequire(unpackedModule.localId, unpackedModule.segmentId);

        // Return the exports of the module
        return module.exports;
      }
      
      // Allow module to self register
      __webpack_require__.sr = function (moduleId, factory) {
        // Make sure module is in installedModules
        if (!installedModules[moduleId]) {
          throw new Error(moduleId + ' missing in installedModules');
        }

        var module = installedModules[moduleId];
        factory.call(module.exports, module, module.exports, __webpack_require__);
        
        // Flag the module as loaded
        module.l = true;
      }
      
      global.__webpack_require__ = __webpack_require__;

      /*** END: CUSTOM BOOTSTRAPPER ***/

      `.split('\n');

      const indent = (line: string) => `/*****/  ${line}`;
      const bootstrapCode = `${indent(
        '(function(global){ // bootstraper'
      )}\n${customBootstrapper.map(indent).join('\n')}${webpackBootstrapper
        .map(indent)
        .join('\n')}\n${indent('})(this);')}\n`;

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
