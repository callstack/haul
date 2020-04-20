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

To use the Typescript compiler exclusively on Typescript files without Babel's intervention, you have to remove the Babel loader and then re-add it to the module rules. This is needed if you want to use Typescript features that are currently not supported by Babel, like `const enum` or `namespace`.

The `haul.config.js` should then look something like this:

```js
import { makeConfig, withPolyfills } from '@haul-bundler/preset-0.60';

const removeRuleByTest = (moduleConfig, test) => {
  const index = moduleConfig.findIndex(rule => {
    if (rule.test) {
      return rule.test.toString() === test.toString();
    }
    return false;
  });
  moduleConfig.splice(index, 1);
};

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.ts'),
      transform({ config }) {

        // Remove babel-loader, as it handles both .ts(x) and .js(x) files
        removeRuleByTest(config.module.rules, /\.[jt]sx?$/);

        config.module.rules = [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
          },
          ...config.module.rules,

          // Re-add the babel-loader, now only for .js(x)
          {
            test: /\.jsx?$/,
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [
                require.resolve(
                  '@haul-bundler/core/build/utils/fixRequireIssues',
                ),
              ],
            },
          },
        ];
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
      },
    },
  },
});
```

## Use Haul with `react-native-windows`

Unless you're using different JavaScript VM than ChakraCore (default) to run your JavaScript, add `chakra: true` flag to your `babel.config.js`:
```js
module.exports = {
  presets: [['module:@haul-bundler/babel-preset-react-native', { chakra: true }]],
};
```

### With React Native 0.59

If you want to use `react-native-windows`, you have to register it as a provider of JS modules.

Update your `haul.config.js` like so:
```js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  platforms: ['windows', 'ios', 'android'], // or ['windows'] if you only use windows platform
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      providesModuleNodeModules: ['react-native', 'react-native-windows'],
      hasteOptions: { platforms: ['native', 'windows'] },
    },
  },
});
```

### With React Native 0.60 and newer

With React Native 0.60 and newer, you need to register `react-native-windows` as a module provider and modify `InitializeCore` location and alias `react-native`.

Update your `haul.config.js` like so:
```js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.60";

export default makeConfig({
  platforms: ['windows', 'ios', 'android'], // or ['windows'] if you only use windows platform
  bundles: {
    index: {
      entry: withPolyfills('./index.js', {
        initializeCoreLocation: 'react-native-windows/Libraries/Core/InitializeCore.js'
      }),
      providesModuleNodeModules: ['react-native', 'react-native-windows'],
      hasteOptions: { platforms: ['native', 'windows'] },
      transform({ config }) {
        config.resolve.alias = {
          ...config.resolve.alias,
          'react-native': 'react-native-windows'
        };
      },
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

## Using with Lottie or loose-mode-only-compatible libraries

Some React Native libraries might not work with Haul out of the box. If the library if throw error, it is possible that it's not compatible with strict mode checks.

By default all modules with Haul have `'use strict';` annotation, which makes the code evaluated in strict mode, whereas the default React Native bundler - Metro - generates the code without this annotation. For that reason, some libraries eg `Lottie` need special steps to work.

To enable loose mode, you need to add `looseMode` property to your config set to:

- `true` - removes all `'use strict';` from the whole bundle
- array for absolute filenames of modules - matched modules will have `'use strict';` removed
- array of regexes - matched modules will have `'use strict';` removed
- function that accepts absolute module filename and must return `true` to remove `'use strict';` or `false`

You can mix string and regexes in array.

For example:

```js
// haul.config.js
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.ts'),
      looseMode: [
        require.resolve('./MyModule.js'),
        /node_modules\/react-native-lottie/,
      ],
    },
  },
});
```

## Debugging with React Native Tools (`vscode-react-native`)

In order to use React Native Tools extension you must first install the extension:
```bash
code --install-extension msjsdiag.vscode-react-native
```

Next, you need to tweak your `haul.config.js` and add `source-map-loader`:
```js
import { withPolyfills, makeConfig } from "@haul-bundler/preset-0.60";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      transform({ config }) {
        config.module.rules = [
          ...config.module.rules,
          {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
          }
        ];
      },
    },
  },
});
```

Now use can start Haul packager server (`yarn haul start`) and use _Attach to packager_ configuration in Debug panel in VS Code.

From within the app tap on _Enable remote debugging_. This will open a page in Chrome, which you can safely close.

Finally press _Start debugging_ icon (green triangle) in Debug panel in VS Code.

## Debugging Haul process

You can easily attach Node debugger to Haul process by passing `--node-inspector` option or `NODE_INSPECTOR` environment variable when running Haul:
```bash
yarn haul bundle --platform ios --dev false --node-inspector
# or
NODE_INSPECTOR=1 yarn haul bundle --platform ios --dev false
```

It will run Haul and open debugger connection to which you can attach Node debugger using Chrome debugger for Node or Visual Studio Code debugger.

`--node-inspector`, `--node-inspector true` and `NODE_INSPECTOR=1` work in similar way as passing `--inspect` to a `node` - it doesn't add breakpoint on the first line. If you want to attach debugger before Haul proceed further, use `wait` value:
```bash
yarn haul bundle --platform ios --dev false --node-inspector=wait
# or
NODE_INSPECTOR=wait yarn haul bundle --platform ios --dev false
```

This will make sure the Node debugger is attached before Haul starts executing a command. It works in a similar way as `--inspect-brk` option for `node`.

You can use `NODE_INSPECTOR=1`/`NODE_INSPECTOR=wait` in XCode build phase _Bundle React Native code and images_:
```bash
export CLI_PATH=node_modules/@haul-bundler/cli/bin/haul.js
export NODE_BINARY=node
export NODE_INSPECTOR=wait
../node_modules/react-native/scripts/react-native-xcode.sh
```

and `--node-inspector`/`--node-inspector=wait` in Gradle build file:
```groovy
// android/app/build.gradle
project.ext.react = [
    entryFile: "index.js",
    cliPath: "node_modules/@haul-bundler/cli/bin/haul.js"
    extraPackagerArgs: ['--node-inspector=wait']
]
```
