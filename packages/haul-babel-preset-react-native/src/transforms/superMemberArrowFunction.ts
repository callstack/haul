import createTemplate from '@babel/template';
import * as babel from '@babel/core';

/**
 * With Webpack and babel-loader the following code:
 * ```js
 * class Derived extends Super {
 *   derivedFn1 = async () => {
 *     await super.superFn1();
 *   }
 *
 *   derivedFn2 = () => {
 *     super.superFn2();
 *   }
 * }
 * ```
 * will fail with an exception: `super` cannot be used outside of a class method.
 * However this is a valid syntax, which successfully run for example on V8 or Chrome,
 * so we need to transform `super` to use `Super.prototype`:
 * ```js
 * class Derived extends Super {
 *   derivedFn1 = async () => {
 *     await Super.prototype.superFn1.call(this);
 *   }
 *
 *   derivedFn2 = () => {
 *     Super.prototype.superFn2.call(this);
 *   }
 * }
 * ```
 */

const template = createTemplate('SUPER.prototype.METHOD.call(this, ARGS)');

export default function superMemberArrowFunction() {
  return {
    visitor: {
      Program(programPath: babel.NodePath<babel.types.Program>) {
        programPath.traverse({
          Super(path) {
            let parentFunctionPath = path.getFunctionParent();

            // Check if parent function is an arrow function as a class property.
            if (
              parentFunctionPath.isArrowFunctionExpression() &&
              parentFunctionPath.parentPath.isClassProperty()
            ) {
              // Find the parent class, and make sure it's extending from an identifier
              let parentClass = path.findParent(p =>
                p.isClass()
              ) as babel.NodePath<babel.types.Class>;

              if (
                parentClass?.node.superClass &&
                babel.types.isIdentifier(parentClass.node.superClass)
              ) {
                path.parentPath.parentPath.replaceWith(
                  template({
                    SUPER: parentClass.node.superClass,
                    METHOD: (path.parent as babel.types.MemberExpression)
                      .property,
                    ARGS: (path.parentPath.parent as babel.types.CallExpression)
                      .arguments,
                  }) as any
                );
              }
            }
          },
        });
      },
    },
  };
}
