import DllEntryDependency from 'webpack/lib/dependencies/DllEntryDependency';
import DllModuleFactory from 'webpack/lib/DllModuleFactory';
import DllModule from 'webpack/lib/DllModule';
import { RawSource } from 'webpack-sources';
import webpack from 'webpack';

class InitCoreDllModule extends DllModule {
  constructor(
    context: unknown,
    dependencies: unknown,
    name: unknown,
    type: unknown,
    private getInitCoreSource: () => string
  ) {
    super(context, dependencies, name, type);
  }

  source() {
    return new RawSource(
      `${this.getInitCoreSource()}\nmodule.exports = __webpack_require__;`
    );
  }
}

class InitCoreDllModuleFactory extends DllModuleFactory {
  constructor(private getInitCoreSource: () => string) {
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
      new InitCoreDllModule(
        data.context,
        dependency.dependencies,
        dependency.name,
        dependency.type,
        this.getInitCoreSource
      )
    );
  }
}

export default class InitCoreDllPlugin {
  private initCoreLocation: string = '';

  constructor({ initCoreLocation }: { initCoreLocation: string }) {
    this.initCoreLocation = initCoreLocation;
  }

  apply(compiler: webpack.Compiler) {
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
              const initCoreDllModuleFactory = new InitCoreDllModuleFactory(
                () => {
                  const initCoreModule = compilation.modules.find(
                    webpackModule => {
                      return webpackModule.resource?.endsWith(
                        this.initCoreLocation
                      );
                    }
                  );
                  return initCoreModule
                    ? `__webpack_require__(${JSON.stringify(
                        initCoreModule.id
                      )});`
                    : '';
                }
              );
              compilation.dependencyFactories.set(
                DllEntryDependency as any,
                initCoreDllModuleFactory as any
              );
            },
          };
        }
        return tap;
      },
    });
  }
}
