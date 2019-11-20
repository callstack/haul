import webpack from 'webpack';
import sources from 'webpack-sources';

export default class LooseModeWebpackPlugin {
  constructor(public checkLooseMode: (filename: string) => boolean) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.make.tap(
      'LooseModeWebpackPlugin',
      (compilation: webpack.compilation.Compilation) => {
        compilation.moduleTemplates.javascript.hooks.render.tap(
          'LooseModeWebpackPlugin',
          (
            moduleSource: sources.Source,
            { resource }: { resource: string }
          ) => {
            const useLooseMode = this.checkLooseMode(resource);
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
