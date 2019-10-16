import path from 'path';

export function isTypeScriptSource(fileName: string) {
  return !!fileName && fileName.endsWith('.ts');
}

export function isTSXSource(fileName: string) {
  return !!fileName && fileName.endsWith('.tsx');
}

export function isReactNative(fileName: string) {
  return !!fileName && fileName.includes(`node_modules${path.sep}react-native`);
}

type PluginSpec = [string] | [string, object];

const commonJsPlugin: PluginSpec = [
  '@babel/plugin-transform-modules-commonjs',
  { allowTopLevelThis: true },
];

export function getDefaultPrePlugins(): PluginSpec[] {
  return [
    // The flow strip types plugin must go BEFORE class properties!
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-optional-catch-binding'],
    ['@babel/plugin-syntax-dynamic-import'],
    ['@babel/plugin-syntax-export-default-from'],
    ['@babel/plugin-transform-react-jsx'],
    ['@babel/plugin-transform-sticky-regex'],
    ['@babel/plugin-transform-unicode-regex'],
    [
      // For some reason native async/await don't behave correctly
      // on RN 0.59 on both platforms, so we need to transpile it
      // to native Promises.
      './transforms/superMemberArrowFunction',
    ],
    ['@babel/plugin-transform-async-to-generator'],
  ];
}

export function getDefaultPostPlugins(): PluginSpec[] {
  return [
    ['@babel/plugin-transform-exponentiation-operator'],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-transform-react-display-name'],
    ['metro-react-native-babel-preset/src/transforms/transform-symbol-member'],
  ];
}

export function getHermesPlugins(): PluginSpec[] {
  // Additional plugins for Hermes because it doesn't support ES6 yet
  return [
    ['@babel/plugin-transform-classes'],
    ['@babel/plugin-transform-shorthand-properties'],
    ['@babel/plugin-transform-template-literals', { loose: true }],
  ];
}

export function getChakraPlugins(): PluginSpec[] {
  return [
    ['@babel/plugin-transform-spread'],
    ['@babel/plugin-proposal-object-rest-spread'],
  ];
}

export function getHaulPlugins({
  platform,
}: {
  platform: string;
}): PluginSpec[] {
  return [
    [require.resolve('./transforms/stripDeadPlatformSelect'), { platform }],
  ];
}

export function getTsPlugins({ isTSX }: { isTSX: boolean }): PluginSpec[] {
  return [
    [
      '@babel/plugin-transform-typescript',
      {
        isTSX,
      },
    ],
  ];
}

export function getReactNativePlugins(): PluginSpec[] {
  return [commonJsPlugin];
}

export function getDevelopmentEnvPlugins(): PluginSpec[] {
  return [['@babel/plugin-transform-react-jsx-source']];
}

export function getTestEnvPlugins(): PluginSpec[] {
  return [commonJsPlugin, ...getDevelopmentEnvPlugins()];
}

function requirePlugin(plugin: PluginSpec) {
  return [require(plugin[0])].concat(...(plugin[1] ? [plugin[1]] : []));
}

export default function getHaulBabelPreset(
  api: any,
  options: { hermes?: boolean; chakra?: boolean }
) {
  return {
    compact: false,
    env: {
      // Add CommonJS transform when running in NODE_ENV === test, for example when testing.
      test: {
        plugins: getTestEnvPlugins().map(requirePlugin),
      },
      development: {
        plugins: getDevelopmentEnvPlugins().map(requirePlugin),
      },
    },
    overrides: [
      {
        plugins: [
          ...getDefaultPrePlugins().map(requirePlugin),
          ...(options.hermes ? getHermesPlugins() : []).map(requirePlugin),
          ...(options.chakra ? getChakraPlugins() : []).map(requirePlugin),
          ...(process.env.HAUL_PLATFORM
            ? getHaulPlugins({ platform: process.env.HAUL_PLATFORM })
            : []
          ).map(requirePlugin),
        ],
      },
      {
        test: isReactNative,
        plugins: getReactNativePlugins().map(requirePlugin),
      },
      {
        test: isTypeScriptSource,
        plugins: getTsPlugins({ isTSX: false }).map(requirePlugin),
      },
      {
        test: isTSXSource,
        plugins: getTsPlugins({ isTSX: true }).map(requirePlugin),
      },
      {
        plugins: getDefaultPostPlugins().map(requirePlugin),
      },
    ],
  };
}
