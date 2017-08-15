/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Ideally, this file SHOULD NOT be processed by prettier, since trailing commas
 * are not supported and will cause errors in bundle. This file is used by `babel-loader`
 * and `babel-register` won't be able to strip those trailing commas, thus anyone
 * modifiing this file MUST make sure that prettier won't screw it up - use prettier-ignore
 * or tweak code, so that it won't be formatted.
 */

const { isAbsolute, join } = require('path');
const clone = require('clone');

const MAKE_HOT_NAME = 'makeHot';
const REDRAW_NAME = 'redraw';
const TRY_UPDATE_SELF_NAME = 'tryUpdateSelf';
const CALL_ONCE_NAME = 'callOnce';
const CLEAR_CACHE_FOR_NAME = 'clearCacheFor';

function isValidChildPath(source) {
  if (/^\.\.?\//.test(source)) {
    return true;
  }

  if (isAbsolute(source) && !source.includes('node_modules')) {
    return true;
  }

  return false;
}

const codeSnippets = [
  `${TRY_UPDATE_SELF_NAME}();`,
  `${CALL_ONCE_NAME}(() => {
    APP_REGISTRATION
  });
  `,
  `if (module.hot) {
    module.hot.accept(undefined, () => {
      // Self-accept
    });

    module.hot.accept(CHILDREN_IMPORTS, () => {
      ${CLEAR_CACHE_FOR_NAME}(require.resolve(ROOT_SOURCE_FILEPATH));
      ${REDRAW_NAME}(() => require(ROOT_SOURCE_FILEPATH).default);
    });
  }
  `,
];

function createHmrLogic(template) {
  return codeSnippets.map(snippet => template(snippet));
}

// prettier-ignore
function applyHmrTweaks(
  { types: t, template },
  programPath,
  hmrImportPath,
  state
) {
  if (
    !programPath.node.body.find(
      bodyNode =>
        t.isImportDeclaration(bodyNode) &&
        bodyNode.source.value === 'haul/hot/path'
    )
  ) {
    programPath.node.body.unshift(t.importDeclaration([], t.stringLiteral('haul/hot/patch')));
  }

  const specifiers = [
    t.importSpecifier(t.identifier(MAKE_HOT_NAME), t.identifier(MAKE_HOT_NAME)),
    t.importSpecifier(t.identifier(REDRAW_NAME), t.identifier(REDRAW_NAME)),
    t.importSpecifier(t.identifier(TRY_UPDATE_SELF_NAME), t.identifier(TRY_UPDATE_SELF_NAME)),
    t.importSpecifier(t.identifier(CALL_ONCE_NAME), t.identifier(CALL_ONCE_NAME)),
    t.importSpecifier(t.identifier(CLEAR_CACHE_FOR_NAME), t.identifier(CLEAR_CACHE_FOR_NAME)),
  ];
  hmrImportPath.node.specifiers.push(...specifiers);
  let hasValidDefaultExport = false;
  let appRegistrationAST = null;
  const childrenImports = [];
  let sourceFilepath = state.file.opts.filename;
  if (!sourceFilepath.includes(process.cwd())) {
    sourceFilepath = join(process.cwd(), sourceFilepath);
  }

  programPath.traverse({
    ImportDeclaration(subpath) {
      if (isValidChildPath(subpath.node.source.value)) {
        childrenImports.push(subpath.node.source.value);
      }
    },
    ExportDefaultDeclaration(subpath) {
      if (t.isClassDeclaration(subpath.node.declaration)) {
        hasValidDefaultExport = true;
      }
    },
    CallExpression(subpath) {
      // Tweak AppRegistry.registerComponent function call
      if (
        t.isMemberExpression(subpath.node.callee) &&
        subpath.node.callee.object.name === 'AppRegistry' &&
        subpath.node.callee.property.name === 'registerComponent'
      ) {
        // Original Root component factory function
        const rootFactory = subpath.node.arguments[1];

        // Wrap Root component factory using withHMR
        // eslint-disable-next-line no-param-reassign
        subpath.node.arguments = [
          subpath.node.arguments[0],
          t.callExpression(
            t.identifier(MAKE_HOT_NAME),
            [rootFactory]
          ),
        ];

        appRegistrationAST = clone(subpath);
        subpath.remove();
      }
    },
  });

  // Throw error if the root component is not a exported as default
  if (!hasValidDefaultExport) {
    throw new Error('Haul HMR: Root component must be exported using `export default`');
  }

  if (!appRegistrationAST) {
    throw new Error(
      // prettier-ignore
      'Haul HMR: `haul-hmr` must be imported in the Root component with the presense ' +
        'of `AppRegistry.registerComponent` call'
    );
  }

  programPath.node.body.push(
    ...createHmrLogic(template).map(tmpl =>
      // prettier-ignore
      tmpl({
        APP_REGISTRATION: appRegistrationAST,
        CHILDREN_IMPORTS: t.arrayExpression(
          // prettier-ignore
          childrenImports.map(item => t.stringLiteral(item))
        ),
        ROOT_SOURCE_FILEPATH: t.stringLiteral(sourceFilepath),
      }))
  );
}

module.exports = babel => {
  return {
    visitor: {
      Program(path, state) {
        path.traverse({
          ImportDeclaration(importPath) {
            if (
              importPath.node.source.value === 'haul/hot' &&
              !importPath.node.specifiers.length
            ) {
              applyHmrTweaks(babel, path, importPath, state);
            }
          },
        });
      },
    },
  };
};
