import webpack from 'webpack';
import sources from 'webpack-sources';
import path from 'path';
import { LooseModeConfig } from '../../types';

/**
 * Enable JavaScript loose mode, by removing `use strict` directives from the code.
 * This plugin should only be used for compatibility reasons with Metro, where some libraries
 * might not work in JavaScript Strict mode.
 */
export class LooseModePlugin {
  shouldUseLoosMode: (filename: string) => boolean;

  /**
   * Constructs new `LooseModePlugin`.
   *
   * @param config - Plugin config value, can be either a:
   * - `boolean` - enables or disables loose mode for all the modules within a bundle,
   * - `string[]` - enables loose mode for only modules specified within the array,
   * - `RegExp[]` - enables loose mode for only modules matching any of the regex within the array,
   * - `(filename: string) => boolean` - enables loose mode for only modules, for which the function returns `true`.
   */
  constructor(config: LooseModeConfig) {
    if (config === true) {
      this.shouldUseLoosMode = () => true;
    } else if (Array.isArray(config)) {
      this.shouldUseLoosMode = (filename: string) => {
        return (config as Array<string | RegExp>).some(element => {
          if (typeof element === 'string') {
            if (!path.isAbsolute(element)) {
              throw new Error(
                `${element} in 'looseMode' property must be an absolute path or regex`
              );
            }
            return element === filename;
          }

          return element.test(filename);
        });
      };
    } else if (typeof config === 'function') {
      this.shouldUseLoosMode = config;
    } else {
      this.shouldUseLoosMode = () => false;
    }
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.make.tap(
      'HaulLooseModePlugin',
      (compilation: webpack.compilation.Compilation) => {
        compilation.moduleTemplates.javascript.hooks.render.tap(
          'HaulLooseModePlugin',
          (
            moduleSource: sources.Source,
            { resource }: { resource: string }
          ) => {
            const useLooseMode = this.shouldUseLoosMode(resource);
            if (!useLooseMode) {
              return moduleSource;
            }

            const source = moduleSource.source();
            const match = source.match(/['"]use strict['"]/);
            if (!match || match.index === undefined) {
              return moduleSource;
            }
            const replacement = new sources.ReplaceSource(moduleSource);
            replacement.replace(match.index, match.index + match[0].length, '');
            return replacement;
          }
        );
      }
    );
  }
}
