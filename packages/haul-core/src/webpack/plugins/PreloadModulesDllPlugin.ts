import DllEntryDependency from 'webpack/lib/dependencies/DllEntryDependency';
import DllModuleFactory from 'webpack/lib/DllModuleFactory';
import DllModule from 'webpack/lib/DllModule';
import { RawSource } from 'webpack-sources';
import webpack from 'webpack';
import { ResolverFactory } from 'enhanced-resolve';

class PreloadDllModule extends DllModule {
  constructor(
    context: unknown,
    dependencies: unknown,
    name: unknown,
    type: unknown,
    private getPreloadSource: () => string
  ) {
    super(context, dependencies, name, type);
  }

  source() {
    return new RawSource(
      `${this.getPreloadSource()}\nmodule.exports = __webpack_require__;`
    );
  }
}

class PreloadDllModuleFactory extends DllModuleFactory {
  constructor(private getPreloadSource: () => string) {
    super();
  }

  create(
    data: {
      dependencies: Array<{ dependencies: []; name: unknown; type: unknown }>;
      context: unknown;
    },
    callback: (error: Error | null, value: any) => void
  ) {
    const dependency = data.dependencies[0];
    callback(
      null,
      new PreloadDllModule(
        data.context,
        dependency.dependencies,
        dependency.name,
        dependency.type,
        this.getPreloadSource
      )
    );
  }
}

/**
 * For multi-bundle v2, the index (first) bundle will contain React Native code.
 * If the bundle is a DLL bundle, then this code, which contain initialization logic will
 * not be executed by default.
 *
 * This plugin allow to add imports for specified modules into the entry point of a DLL bundle,
 * thus allowing to run the code that needs to be executed to setup environment correctly.
 */
export class PreloadModulesDllPlugin {
  private modules: string[] = [];
  private resolvedModules: string[] = [];

  /**
   * Constructs new `PreloadModulesDllPlugin`.
   *
   * @param config - Config object with `modules` to import (thus execute) in DLL bundle entry point.
   * Each value should be a path to a module, that will undergo standard Webpack resolution mechanism.
   * It's recommended to use the same path as the one provided in `entry` array in Webpack config.
   */
  constructor({ modules }: { modules: string[] }) {
    this.modules = modules;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.beforeRun.tapPromise(
      'HaulPreloadModulesDllPlugin',
      async compiler => {
        const resolver = ResolverFactory.createResolver({
          ...compiler.options.resolve,
          fileSystem: compiler.inputFileSystem,
        } as ResolverFactory.ResolverOption);
        this.resolvedModules = await Promise.all(
          this.modules.map(
            async modulePath =>
              new Promise<string>((resolve, reject) => {
                resolver.resolve(
                  {},
                  compiler.context,
                  modulePath,
                  (error, resolved) => {
                    if (error) {
                      reject(error);
                    } else {
                      resolve(resolved);
                    }
                  }
                );
              })
          )
        );
      }
    );

    compiler.hooks.compilation.intercept({
      register: tap => {
        // Intercept tap from DllEntryPlugin in order to modify it.
        // The modified tap function, will call original DllEntryPlugin tap function,
        // and then overwrite the DllEntryDependency value in compilation.dependencyFactories
        // with custom one.
        if (tap.name === 'DllEntryPlugin') {
          return {
            ...tap,
            fn: (
              compilation: webpack.compilation.Compilation,
              ...args: any[]
            ) => {
              tap.fn(compilation, ...args);
              const preloadDllModuleFactory = new PreloadDllModuleFactory(
                () => {
                  const moduleIds = compilation.modules.reduce(
                    (acc, webpackModule) => {
                      if (
                        this.resolvedModules.some(
                          modulePath => webpackModule.resource === modulePath
                        )
                      ) {
                        return {
                          ...acc,
                          [webpackModule.resource]: webpackModule.id,
                        };
                      }

                      return acc;
                    },
                    {}
                  );

                  const setupCode = this.resolvedModules
                    .filter(modulePath => moduleIds[modulePath])
                    .map(
                      resolvedSetupFile =>
                        `__webpack_require__(${JSON.stringify(
                          moduleIds[resolvedSetupFile]
                        )});`
                    )
                    .join('\n');
                  return setupCode;
                }
              );
              compilation.dependencyFactories.set(
                DllEntryDependency as any,
                preloadDllModuleFactory as any
              );
            },
          };
        }
        return tap;
      },
    });
  }
}
