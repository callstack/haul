const defaultPlugins = [
  [require('@babel/plugin-proposal-class-properties')],
  [require('@babel/plugin-proposal-optional-catch-binding')],
  [require('@babel/plugin-syntax-dynamic-import')],
  [require('@babel/plugin-syntax-export-default-from')],
  [require('@babel/plugin-transform-react-jsx')],
  [require('@babel/plugin-transform-sticky-regex')],
  [require('@babel/plugin-transform-unicode-regex')],
  [
    require('@babel/plugin-transform-modules-commonjs'),
    { allowTopLevelThis: true },
  ],
];

function isTypeScriptSource(fileName: string) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName: string) {
  return !!fileName && fileName.endsWith('.tsx');
}

export default function getHaulBabelPreset() {
  return {
    comments: false,
    compact: true,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [require('@babel/plugin-transform-flow-strip-types')],
      },
      {
        plugins: defaultPlugins,
      },
      {
        test: isTypeScriptSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: false,
            },
          ],
        ],
      },
      {
        test: isTSXSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: true,
            },
          ],
        ],
      },
      {
        plugins: [
          require('@babel/plugin-transform-exponentiation-operator'),
          [
            require('@babel/plugin-proposal-nullish-coalescing-operator'),
            {
              loose: true,
            },
          ],
          [
            require('@babel/plugin-proposal-optional-chaining'),
            {
              loose: true,
            },
          ],
          require('@babel/plugin-transform-react-display-name'),
          require('@babel/plugin-transform-react-jsx-source'),
          require('metro-react-native-babel-preset/src/transforms/transform-symbol-member'),
        ],
      },
    ],
  };
}
