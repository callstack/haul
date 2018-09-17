/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Ideally, this file SHOULD NOT be processed by prettier, since trailing commas
 * are not supported and will cause errors in bundle. This file is used by `babel-loader`
 * and `babel-register` won't be able to strip those trailing commas, thus anyone
 * modifying this file MUST make sure that prettier won't screw it up - use prettier-ignore
 * or tweak code, so that it won't be formatted.
 */

// prettier-ignore

const { isAbsolute, join } = require('path');
const clone = require('clone');

const MAKE_HOT_NAME = 'makeHot';
const REDRAW_NAME = 'redraw';
const TRY_UPDATE_SELF_NAME = 'tryUpdateSelf';
const CALL_ONCE_NAME = 'callOnce';
const CLEAR_CACHE_FOR_NAME = 'clearCacheFor';

function createHmrLogic(template) {
  return template(`
    ${TRY_UPDATE_SELF_NAME}();
    ${CALL_ONCE_NAME}(function () {
      APP_REGISTRATION
    });
    if (module.hot) {
      module.hot.accept(undefined, function () {
        // Self-accept
      });

      module.hot.accept(CHILDREN_IMPORTS, function () {
        ${CLEAR_CACHE_FOR_NAME}(require.resolve(ROOT_SOURCE_FILEPATH));
        ${REDRAW_NAME}(() => require(ROOT_SOURCE_FILEPATH).default);
      });
    }
  `);
}

function isValidChildPath(source) {
  if (/^\.\.?\//.test(source)) {
    return true;
  }

  if (isAbsolute(source) && !source.includes('node_modules')) {
    return true;
  }

  return false;
}

function getReturnedId({ isIdentifier, isReturnStatement }, { body }) {
  if (isIdentifier(body)) {
    return body;
  }

  const returnStatement = body.body.find(node => isReturnStatement(node));
  return returnStatement ? returnStatement.argument : {};
}

function isLegacy(metadata) {
  return (
    metadata.exportDeclarationPath &&
    metadata.rootComponentName &&
    metadata.exportDeclarationPath.node.declaration.id.name ===
      metadata.rootComponentName
  );
}

const visitor = {
  'ImportDefaultSpecifier|ImportSpecifier': function _(path) {
    if (isValidChildPath(path.parentPath.node.source.value)) {
      this.importedModules.push({
        id: path.node.local.name,
        source: path.parentPath.node.source.value,
      });
    }
  },
  ExportDefaultDeclaration(path) {
    this.exportDeclarationPath = path;
  },
  CallExpression(path) {
    // Tweak AppRegistry.registerComponent function call
    if (
      this.types.isMemberExpression(path.node.callee) &&
      path.node.callee.object.name === 'AppRegistry' &&
      path.node.callee.property.name === 'registerComponent'
    ) {
      // Original Root component factory function
      const rootFactory = path.node.arguments[1];
      const returnedId = getReturnedId(this.types, rootFactory);
      this.rootComponentName = returnedId.name;

      this.isRootComponentImported = Boolean(
        this.importedModules.find(importedModules => {
          return importedModules.id === returnedId.name;
        })
      );

      // Wrap Root component factory using withHMR
      // eslint-disable-next-line no-param-reassign
      path.node.arguments = [
        path.node.arguments[0],
        this.types.callExpression(this.types.identifier(MAKE_HOT_NAME), [
          rootFactory,
        ]),
      ];

      this.registerComponentDetachedNode = clone(path.node);
      path.remove();
    }
  },
};

function applyHmrTweaks({ types: t, template }, path, state) {
  const { programPath } = state;

  // Add import to `haul/hot/patch` to path React.createElement and createFactory.
  if (
    !programPath.node.body.find(
      bodyNode =>
        t.isImportDeclaration(bodyNode) &&
        bodyNode.source.value === 'haul/hot/path'
    )
  ) {
    programPath.node.body.unshift(
      t.importDeclaration([], t.stringLiteral('haul/hot/patch'))
    );
  }

  // Add specifiers for required functions to import statement.
  const specifiers = [
    t.importSpecifier(t.identifier(MAKE_HOT_NAME), t.identifier(MAKE_HOT_NAME)),
    t.importSpecifier(t.identifier(REDRAW_NAME), t.identifier(REDRAW_NAME)),
    t.importSpecifier(
      t.identifier(TRY_UPDATE_SELF_NAME),
      t.identifier(TRY_UPDATE_SELF_NAME)
    ),
    t.importSpecifier(
      t.identifier(CALL_ONCE_NAME),
      t.identifier(CALL_ONCE_NAME)
    ),
    t.importSpecifier(
      t.identifier(CLEAR_CACHE_FOR_NAME),
      t.identifier(CLEAR_CACHE_FOR_NAME)
    ),
  ];
  path.node.specifiers.push(...specifiers);

  let filename = state.file.opts.filename;
  if (!filename.includes(process.cwd())) {
    filename = join(process.cwd(), filename);
  }

  const metadata = {
    importedModules: [],
    exportDeclarationPath: null,
    rootComponentName: null,
    isRootComponentImported: false,
    registerComponentDetachedNode: null,
    types: t,
  };

  programPath.traverse(visitor, metadata);

  if (!metadata.registerComponentDetachedNode) {
    throw new Error(
      'Haul HMR: `haul/hot` must be imported in the file with `AppRegistry.registerComponent` call.'
    );
  }

  if (isLegacy(metadata)) {
    if (!metadata.exportDeclarationPath) {
      throw new Error(
        'Haul HMR: Root component must be exported using `export default`.'
      );
    }

    programPath.node.body.push(
      ...createHmrLogic(template)({
        APP_REGISTRATION: metadata.registerComponentDetachedNode,
        CHILDREN_IMPORTS: t.arrayExpression(
          metadata.importedModules.map(({ source }) => t.stringLiteral(source))
        ),
        ROOT_SOURCE_FILEPATH: t.stringLiteral(filename),
      })
    );
  } else {
    if (!metadata.isRootComponentImported) {
      throw new Error('Haul HMR: Root component is not imported.');
    }

    const rootComponentSource = metadata.importedModules.find(
      ({ id }) => id === metadata.rootComponentName
    ).source;

    programPath.node.body.push(
      ...createHmrLogic(template)({
        APP_REGISTRATION: metadata.registerComponentDetachedNode,
        CHILDREN_IMPORTS: t.stringLiteral(rootComponentSource),
        ROOT_SOURCE_FILEPATH: t.stringLiteral(rootComponentSource),
      })
    );
  }

  programPath.requeue();
}

module.exports = babel => {
  return {
    visitor: {
      Program(path, state) {
        // eslint-disable-next-line no-param-reassign
        state.programPath = path;
      },
      ImportDeclaration(path, state) {
        if (
          path.node.source.value === 'haul/hot' &&
          !path.node.specifiers.length
        ) {
          applyHmrTweaks(babel, path, state);
        }
      },
    },
  };
};
