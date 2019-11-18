import findProvidesModule from './findProvidesModule';

type Request = {
  request?: string;
};

type Options = {
  directories: Array<string>;
  hasteOptions?: any;
};

/**
 * Resolver plugin that allows requiring haste modules with Webpack
 */
export default class HasteResolver {
  constructor(private options: Options) {}

  apply(resolver: any) {
    const hasteMap = findProvidesModule(
      this.options.directories,
      this.options.hasteOptions
    );

    resolver.hooks.resolve.tapAsync(
      'described-resolve',
      (request: Request, context: unknown, callback: Function) => {
        const innerRequest = request.request;

        if (!innerRequest || !hasteMap[innerRequest]) {
          return callback();
        }

        const obj = Object.assign({}, request, {
          request: hasteMap[innerRequest],
        });

        return resolver.doResolve(
          resolver.hooks.resolve,
          obj,
          `Aliased ${innerRequest} with haste mapping: ${hasteMap[innerRequest]}`,
          context,
          callback
        );
      }
    );
  }
}
