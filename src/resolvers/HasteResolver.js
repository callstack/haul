/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
type Request = {
  request?: string,
};

type Options = {
  directories: Array<string>,
};

const findProvidesModule = require('../utils/findProvidesModule');

/**
 * Resolver plugin that allows requiring haste modules with Webpack
 */
function HasteResolver(options: Options) {
  const hasteMap = findProvidesModule(options.directories);

  this.apply = resolver => {
    resolver.plugin(
      'described-resolve',
      (request: Request, callback: Function) => {
        const innerRequest = request.request;

        if (!innerRequest || !hasteMap[innerRequest]) {
          return callback();
        }

        const obj = Object.assign({}, request, {
          request: hasteMap[innerRequest],
        });

        return resolver.doResolve(
          'resolve',
          obj,
          `Aliased ${innerRequest} with haste mapping: ${hasteMap[
            innerRequest
          ]}`,
          callback,
        );
      },
    );
  };
}

module.exports = HasteResolver;
