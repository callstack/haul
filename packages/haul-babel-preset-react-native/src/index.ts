const defaultPlugins = [
  [require('@babel/plugin-proposal-class-properties'), { loose: true }],
  [require('@babel/plugin-proposal-optional-catch-binding')],
  [require('@babel/plugin-syntax-dynamic-import')],
  [require('@babel/plugin-syntax-export-default-from')],
  [require('@babel/plugin-transform-react-jsx')],
  [require('@babel/plugin-transform-sticky-regex')],
  [require('@babel/plugin-transform-unicode-regex')],
  // For some reason native async/await don't behave correctly
  // on RN 0.59 on both platforms, so we need to transpile it
  // to native Promises.
  [require('./transforms/superMemberArrowFunction').default],
  [require('@babel/plugin-transform-async-to-generator')],
];

// Additional plugins for Hermes because it doesn't support ES6 yet
const hermesPlugins = [
  [require('@babel/plugin-transform-classes')],
  [require('@babel/plugin-transform-shorthand-properties')],
  [require('@babel/plugin-transform-template-literals'), { loose: true }],
];

function isTypeScriptSource(fileName: string) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName: string) {
  return !!fileName && fileName.endsWith('.tsx');
}

export default function getHaulBabelPreset(
  api: any,
  options: { hermes: boolean }
) {
  return {
    compact: false,
    overrides: [
      // The flow strip types plugin must go BEFORE class properties!
      {
        plugins: [require('@babel/plugin-transform-flow-strip-types')],
      },
      {
        plugins: [
          ...defaultPlugins,
          ...(options.hermes ? hermesPlugins : []),
          ...(process.env.HAUL_PLATFORM
            ? [
                [
                  require('./transforms/stripDeadPlatformSelect'),
                  { platform: process.env.HAUL_PLATFORM },
                ],
              ]
            : []),
        ],
      },
      {
        test: /node_modules\/react-native/,
        plugins: [
          [
            require('@babel/plugin-transform-modules-commonjs'),
            { allowTopLevelThis: true },
          ],
        ],
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
          require('metro-react-native-babel-preset/src/transforms/transform-symbol-member'),
          ...(process.env.NODE_ENV === 'production'
            ? []
            : [require('@babel/plugin-transform-react-jsx-source')]),
        ],
      },
    ],
  };
}
