/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @noflow
 */

function fixRequireIssue() {
  return {
    visitor: {
      AssignmentExpression(path) {
        if (path.node.operator === '=') {
          const { left } = path.node;

          if (left.type !== 'MemberExpression') {
            return;
          }

          const { object } = left;

          if (
            // require.xxx
            (object.type === 'Identifier' && object.name === 'require') ||
            // (require: any).xxx
            (object.type === 'TypeCastExpression' &&
              object.expression.name === 'require')
          ) {
            path.remove();
          }
        }
      },
    },
  };
}

module.exports = fixRequireIssue;
