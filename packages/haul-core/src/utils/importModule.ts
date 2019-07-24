import fs from 'fs';
import path from 'path';
import vm from 'vm';
import Module from 'module';
import * as babel from '@babel/core';
import Runtime from '../runtime/Runtime';

type ModuleCache = { [id: string]: Module };

type Options = {
  resolve: (moduleId: string) => string;
  parentModule?: Module;
  ignore?: Array<string | RegExp> | ((moduleId: string) => boolean);
  cache?: ModuleCache;
  runtime: Runtime;
};

const nativeRequire = require;

function loadModule(
  filename: string,
  options: {
    resolve: Options['resolve'];
    parentModule: NonNullable<Options['parentModule']>;
    ignore: NonNullable<Options['ignore']>;
    cache: NonNullable<Options['cache']>;
    runtime: Runtime;
  }
) {
  const moduleFilename = options.resolve(filename);

  if (Module.builtinModules.includes(moduleFilename)) {
    return nativeRequire(moduleFilename);
  }

  if (options.cache[moduleFilename]) {
    return options.cache[moduleFilename].exports;
  }

  const moduleBody = fs.readFileSync(moduleFilename, 'utf8');
  const module = new Module(moduleFilename, options.parentModule);
  module.filename = moduleFilename;
  options.cache[module.id] = module;

  const require = (moduleId: string) => {
    return loadModule(moduleId, {
      resolve: ((Module.createRequireFromPath(module.filename) as unknown) as {
        resolve: RequireResolve;
      }).resolve,
      parentModule: module,
      ignore: options.ignore,
      cache: options.cache,
      runtime: options.runtime,
    });
  };

  require.resolve = options.resolve;

  if (/\.json$/.test(module.filename)) {
    module.exports = JSON.parse(moduleBody);
    module.loaded = true;
    return module.exports;
  }

  let moduleFactory: Function;
  try {
    moduleFactory = vm.runInThisContext(Module.wrap('\n' + moduleBody), {
      filename: module.filename,
    });
  } catch (error) {
    let ignoreModuleTranspilation = false;
    if (typeof options.ignore === 'function') {
      ignoreModuleTranspilation = options.ignore(module.filename);
    } else {
      ignoreModuleTranspilation = options.ignore.some(ignorePattern => {
        if (typeof ignorePattern === 'string') {
          return module.filename.startsWith(ignorePattern);
        }

        return ignorePattern.test(module.filename);
      });
    }

    if (ignoreModuleTranspilation) {
      throw error;
    }

    // If the parsing failed, transpile the code with babel and try again.
    let transpilationResults: babel.BabelFileResult | null;
    try {
      // Use hardcored plugins and preset, since we cannot use Babel config from project, due
      // to different targets - project babel config might have commonjs transform disabled etc.
      transpilationResults = babel.transformSync(moduleBody, {
        filename: module.filename,
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 10,
              },
            },
          ],
          '@babel/preset-typescript',
        ],
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-transform-flow-strip-types',
        ],
      });
    } catch (error) {
      options.runtime.logger.error(
        `Failed to transpile module ${module.filename}:`
      );
      throw error;
    }

    if (transpilationResults && transpilationResults.code) {
      moduleFactory = vm.runInThisContext(
        Module.wrap('\n' + transpilationResults.code),
        {
          filename: module.filename,
        }
      );
    } else {
      throw new Error(`Failed to transpile module ${module.filename}`);
    }
  }

  moduleFactory(
    module.exports,
    require,
    module,
    module.filename,
    path.dirname(module.filename)
  );
  module.loaded = true;
  return module.exports;
}

export default function importModule(filename: string, options: Options) {
  const { resolve, parentModule, ignore = [], cache = {}, runtime } = options;

  const exports = loadModule(filename, {
    resolve,
    parentModule: parentModule || module,
    ignore,
    cache,
    runtime,
  });

  return {
    exports,
    cache,
  };
}
