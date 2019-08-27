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

const nativeRequire = require;
const builtinModules = ['debug'].concat(Module.builtinModules);

function loadModule(
  filename: string,
  provided: {
    resolve: Options['resolve'];
    parentModule: NonNullable<Options['parentModule']>;
    ignore: NonNullable<Options['ignore']>;
    cache: NonNullable<Options['cache']>;
    runtime: Runtime;
  }
) {
  // Resolve absolute module location using parent's resolver.
  const moduleFilename = provided.resolve(filename);

  // Use native require if requested module is a build-in one.
  // Built-in modules are not kept in isolated cache, but in the native cache.
  if (builtinModules.includes(moduleFilename)) {
    return nativeRequire(moduleFilename);
  }

  // Use exports from cache is available.
  if (provided.cache[moduleFilename]) {
    return provided.cache[moduleFilename].exports;
  }

  let moduleBody: string;
  try {
    moduleBody = fs.readFileSync(moduleFilename, 'utf8');
  } catch (error) {
    throw new Error(
      `Module '${filename}' resolved to '${moduleFilename}' not found: ${error.code}`
    );
  }

  // Instantiating a new Module will setup some some properties, but won't
  // load the module code by itself, so we can do it ourselves later.
  const module = new Module(moduleFilename, provided.parentModule);
  module.filename = moduleFilename;
  // Resolve lookup paths (for example paths to node_modules for each parent directory).
  module.paths = ((Module as unknown) as {
    _resolveLookupPaths: (request: string, parent?: Module) => string[][];
  })
    ._resolveLookupPaths(module.filename, provided.parentModule)
    .reduce(
      (acc, item) =>
        Array.isArray(item) ? acc.concat(...item) : acc.concat(item),
      []
    )
    .concat(path.dirname(module.filename));
  provided.cache[module.id] = module;

  // Create resolver for this module.
  const currentResolve = ((Module.createRequireFromPath(
    module.filename
  ) as unknown) as {
    resolve: RequireResolve;
  }).resolve;

  // Create require function for this module.
  const currentRequire = (moduleId: string) => {
    return loadModule(moduleId, {
      resolve: currentResolve,
      parentModule: module,
      ignore: provided.ignore,
      cache: provided.cache,
      runtime: provided.runtime,
    });
  };

  // Set `resolve` and `cache` on `require` function.
  currentRequire.resolve = currentResolve;
  currentRequire.cache = provided.cache;

  // Special case for JSON files.
  if (/\.json$/.test(module.filename)) {
    module.exports = JSON.parse(moduleBody);
  } else {
    let moduleFactory: Function;
    try {
      // Try to create a module factory function. If it fails, there's a good cache that the
      // module needs to be transpiled.
      moduleFactory = vm.runInThisContext(Module.wrap('\n' + moduleBody), {
        filename: module.filename,
      });
    } catch (error) {
      // Figure out if module should be transpiled.
      let shouldTranspile = true;
      if (typeof provided.ignore === 'function') {
        shouldTranspile = !provided.ignore(module.filename);
      } else {
        shouldTranspile = !provided.ignore.some(ignorePattern => {
          if (typeof ignorePattern === 'string') {
            return module.filename.startsWith(ignorePattern);
          }

          return ignorePattern.test(module.filename);
        });
      }

      // Throw original error if module ignored and thus should not be transpiled.
      if (!shouldTranspile) {
        throw error;
      }

      // If the parsing failed, transpile the code with babel and try again.
      let transpilationResults: babel.BabelFileResult | null;
      try {
        // Use hardcoded plugins and preset, since we cannot use Babel config from project, due
        // to different targets - project babel config might have commonjs transform disabled etc.
        transpilationResults = babel.transformSync(moduleBody, {
          filename: module.filename,
          presets: [
            [
              require.resolve('@babel/preset-env'),
              {
                targets: {
                  node: 'current',
                },
              },
            ],
            require.resolve('@babel/preset-typescript'),
          ],
          plugins: [
            require.resolve('@babel/plugin-proposal-class-properties'),
            require.resolve('@babel/plugin-transform-flow-strip-types'),
          ],
        });
      } catch (error) {
        // Transpilation failed. Babel sometimes might not print which file it was transpiling
        // so, log it here and then throw error from Babel.
        provided.runtime.logger.error(
          `Failed to transpile module ${module.filename}:`
        );
        throw error;
      }

      if (transpilationResults && transpilationResults.code) {
        // Try to evaluate the module factory again using transpiled code. If it fails, the
        // error will propagate to up the stack - there's nothing we need to do.
        moduleFactory = vm.runInThisContext(
          Module.wrap('\n' + transpilationResults.code),
          {
            filename: module.filename,
          }
        );
      } else {
        // Edge case if transpilation failed, but we don't know why.
        throw new Error(
          `Failed to transpile module ${module.filename} due to unknown reason`
        );
      }
    }

    // Evaluate the actual module's code.
    moduleFactory(
      module.exports,
      currentRequire,
      module,
      module.filename,
      path.dirname(module.filename)
    );
  }

  module.loaded = true;
  return module.exports;
}
