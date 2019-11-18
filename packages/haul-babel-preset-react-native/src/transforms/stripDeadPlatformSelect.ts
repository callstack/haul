import * as babel from '@babel/core';

export default function stripDeadPlatformSelect() {
  return {
    visitor: {
      CallExpression(
        path: babel.NodePath<babel.types.CallExpression>,
        state: { opts: { platform: string } }
      ) {
        if (
          babel.types.isMemberExpression(path.node.callee) &&
          babel.types.isIdentifier(path.node.callee.object) &&
          babel.types.isIdentifier(path.node.callee.property) &&
          path.node.callee.object.name === 'Platform' &&
          path.node.callee.property.name === 'select' &&
          babel.types.isObjectExpression(path.node.arguments[0])
        ) {
          const platformsSpecs = (path.node
            .arguments[0] as unknown) as babel.types.ObjectExpression;

          let canStripPlatformSelect = true;
          let targetCase: babel.types.ObjectProperty | undefined;
          let defaultCase: babel.types.ObjectProperty | undefined;
          const additionalProperties: babel.types.ObjectExpression['properties'] = [];

          platformsSpecs.properties.forEach(property => {
            if (
              babel.types.isObjectProperty(property) &&
              babel.types.isIdentifier(property.key)
            ) {
              if (property.key.name === 'default') {
                defaultCase = property;
              } else if (property.key.name === state.opts.platform) {
                targetCase = property;
              }
            } else {
              canStripPlatformSelect = false;
              additionalProperties.push(property);
            }
          });

          // If we got exact mach, we can strip the rest
          if (targetCase) {
            canStripPlatformSelect = true;
          }

          if (!targetCase && !defaultCase && canStripPlatformSelect) {
            path.replaceWithSourceString('undefined');
          } else if (canStripPlatformSelect && (targetCase || defaultCase)) {
            path.replaceWith((targetCase || defaultCase)!.value as any);
          } else {
            platformsSpecs.properties = [
              targetCase || defaultCase,
              ...additionalProperties,
            ].filter(Boolean) as babel.types.ObjectExpression['properties'];
          }
        }
      },
    },
  };
}
