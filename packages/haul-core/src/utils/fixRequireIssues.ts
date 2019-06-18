module.exports = function fixRequireIssue() {
  return {
    visitor: {
      AssignmentExpression(path: any) {
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
};
