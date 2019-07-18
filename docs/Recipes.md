---
id: recipes
title: Recipes
---

## Typescript

__If you're using `@haul-bundler/babel-preset-react-native` Babel preset, you don't need to do anything__ and start using Typescript immediately!

### with Babel

The easiest way to use Typescript in React Native apps is by using Babel to transpile TS files. There are some limitations, which you can read more about [here](https://babeljs.io/docs/en/babel-plugin-transform-typescript).

If you're using Haul's `@haul-bundler/babel-preset-react-native` you can start using Typescript without any manual work, since it support TS out of the box.

If you have custom Babel config, you need to add [`@babel/preset-typescript`](https://babeljs.io/docs/en/babel-preset-typescript) preset and configure it.

### with TS compiler (`tsc`)

If you want to use Typescript's official compiler and toolchain, you will need to install `ts-loader` and add it to Webpack config:

```yarn add --dev ts-loader```

This is a `haul.config.js` that works with TypeScript:
```js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.ts'),
      transform({ config }) {
        config.module.rules = [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader'
          },
          ...config.module.rules,
        ];
         config.resolve.extensions = [
          '.ts',
          '.tsx',
          `.${env.platform}.ts`,
          '.native.ts',
          `.${env.platform}.tsx`,
          '.native.tsx',
          ...config.resolve.extensions,
        ]
      },
    },
  },
});
```

And a corresponding (example) `tsconfig.json`
```json
{
  "compilerOptions": {
    "jsx": "react",
    "target": "es2015",
    "moduleResolution": "node",
    "sourceMap": true
  },
  "exclude": [
    "node_modules"
  ]
}
```

Please note, that if you want to use synthetic default imports, a.k.a. things like `import React from 'react'` instead of `import * as React from 'react'` you will need to:

1. Add `"allowSyntheticDefaultImports": true` to `tsconfig.json`.
2. Pass the compiled TS files through Babel (you will need `babel-loader` for this - `yarn add --dev babel-loader`).

Revised `haul.config.js`:
```javascript
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.ts'),
      transform({ config }) {
        config.module.rules = [
          {
            test: /\.tsx?$/,
            exclude: '/node_modules/',
            use: [
              {
                loader: 'babel-loader',
              },
              {
                loader: 'ts-loader',
              }
            ]
          },
          ...config.module.rules,
        ];
         config.resolve.extensions = [
          '.ts',
          '.tsx',
          `.${env.platform}.ts`,
          '.native.ts',
          `.${env.platform}.tsx`,
          '.native.tsx',
          ...config.resolve.extensions,
        ]
      },
    },
  },
});
```

## Use Haul with `react-native-windows`

If you want to use `react-native-windows`, you can register windows as a supported platform type for the commandline, and for windows platform builds add the react-native-windows package as an additional package to look for RN modules:
```js
// haul.config.js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  platforms: ['windows', 'ios', 'android'],
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      providesModuleNodeModules: ['react-native', 'react-native-windows'],
      hasteOptions: { platforms: ['native', 'windows'] },
    },
  },
});
```

## Mock files when running detox tests

[Detox](https://github.com/wix/detox) is a "grey box" e2e framework developed by wix.
It provides the ability to mock files during tests using [react-native-repackager](https://github.com/wix/react-native-repackager)

`react-native-repackager` is built for the standard `react-native` packager, so your mocks won't work with Haul out-of-the-box. Luckily, it's easy to configure Haul (webpack, actually) to resolve the mocked files instead of the original ones during tests:

```js
// haul.config.js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.ts'),
      transform({ config }) {
        config.resolve = {
          ...config.resolve,
          extensions: process.env.APP_ENV === 'detox_tests'
            ? ['.mock.behaviour.js', ...config.resolve.extensions]
            : config.resolve.extensions
        };
      },
    },
  },
});
```

Set the environment variable `APP_ENV` to `detox_tests` when running Haul:

```sh
APP_ENV=detox_tests yarn haul
```

## Debugging with React Native Tools (`vscode-react-native`)

In order to use React Native Tools extension you must first install the extension:
```bash
code --install-extension msjsdiag.vscode-react-native
```

Next, you need to tweak your `haul.config.js` and add `source-map-loader`:
```diff
import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.60";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
+      transform({ config }) {
+        config.module.rules = [
+          ...config.module.rules,
+          {
+            test: /\.js$/,
+            use: ["source-map-loader"],
+            enforce: "pre"
+          }
+        ];
+      },
    },
  },
});
```

Now use can start Haul packager server (`yarn haul start`) and use _Attach to packager_ configuration in debug panel in VS Code.
