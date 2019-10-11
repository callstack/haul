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

type PluginSpec = {
  name: string;
  options?: object;
};

const commonJsPlugin: PluginSpec = {
  name: '@babel/plugin-transform-modules-commonjs',
  options: { allowTopLevelThis: true },
};

export function getDefaultPrePlugins(): PluginSpec[] {
  return [
    {
      // The flow strip types plugin must go BEFORE class properties!
      name: '@babel/plugin-transform-flow-strip-types',
    },
    {
      name: '@babel/plugin-proposal-class-properties',
      options: { loose: true },
    },
    { name: '@babel/plugin-proposal-optional-catch-binding' },
    { name: '@babel/plugin-syntax-dynamic-import' },
    { name: '@babel/plugin-syntax-export-default-from' },
    { name: '@babel/plugin-transform-react-jsx' },
    { name: '@babel/plugin-transform-sticky-regex' },
    { name: '@babel/plugin-transform-unicode-regex' },
    {
      // For some reason native async/await don't behave correctly
      // on RN 0.59 on both platforms, so we need to transpile it
      // to native Promises.
      name: './transforms/superMemberArrowFunction',
    },
    { name: '@babel/plugin-transform-async-to-generator' },
  ];
}

export function getDefaultPostPlugins(): PluginSpec[] {
  return [
    {
      name: '@babel/plugin-transform-exponentiation-operator',
    },
    {
      name: '@babel/plugin-proposal-nullish-coalescing-operator',
      options: { loose: true },
    },
    {
      name: '@babel/plugin-proposal-optional-chaining',
      options: { loose: true },
    },
    {
      name: '@babel/plugin-transform-react-display-name',
    },
    {
      name:
        'metro-react-native-babel-preset/src/transforms/transform-symbol-member',
    },
  ];
}

export function getHermesPlugins(): PluginSpec[] {
  // Additional plugins for Hermes because it doesn't support ES6 yet
  return [
    { name: '@babel/plugin-transform-classes' },
    { name: '@babel/plugin-transform-shorthand-properties' },
    {
      name: '@babel/plugin-transform-template-literals',
      options: { loose: true },
    },
  ];
}

export function getChakraPlugins(): PluginSpec[] {
  return [
    { name: '@babel/plugin-transform-spread' },
    { name: '@babel/plugin-proposal-object-rest-spread' },
  ];
}

export function getHaulPlugins({
  platform,
}: {
  platform: string;
}): PluginSpec[] {
  return [
    {
      name: require.resolve('./transforms/stripDeadPlatformSelect'),
      options: { platform },
    },
  ];
}

export function getTsPlugins({ isTSX }: { isTSX: boolean }): PluginSpec[] {
  return [
    {
      name: '@babel/plugin-transform-typescript',
      options: {
        isTSX,
      },
    },
  ];
}

export function getReactNativePlugins() {
  return [commonJsPlugin];
}

export function getDevelopmentEnvPlugins() {
  return [{ name: '@babel/plugin-transform-react-jsx-source' }];
}

export function getTestEnvPlugins() {
  return [commonJsPlugin, ...getDevelopmentEnvPlugins()];
}

function requirePlugin(plugin: PluginSpec) {
  return [require(plugin.name)].concat(
    ...(plugin.options ? [plugin.options] : [])
  );
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
