---
id: configuration
title: Configuration
---

When running `haul init` the default configuration file - `haul.config.js` - will be created:

```js
import {makeConfig, withPolyfills} from '@haul-bundler/preset-0.59';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
    },
  },
});
```

<sub>
  The preset package might have different numbers for different React Native version: `@haul-bundler/preset-0.59` for RN 0.59.x, `@haul-bundler/preset-0.60` for RN 0.60x, etc.
</sub>

---

You can use the default configuration as it is or tweak it for your needs.

### `makeConfig(projectConfig: ProjectConfig): NormalizedProjectConfig`

This function takes your configuration object, fills in the default values and turns it into a normalized config that Haul understands.

Usually, the return value of `makeConfig` should be returned as default export with `export default`.

| Name            | Type                      | Description                                              |
| --------------- | ------------------------- | -------------------------------------------------------- |
| `projectConfig` | `ProjectConfig`           | User-provided configuration object.                      |
| _returns_       | `NormalizedProjectConfig` | Normalized configuration object with defaults filled-in. |

### `withPolyfills(entry, options)`

Decorate the entry file(s) with React Native polyfills. You can specify custom `root` directory and path to `InitializeCore.js` file.

| Name      | Type                                                 | Description                                                                                                                                                                                                                                              |
| --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`   | `string` / `string[]`                                | Entry file(s) path(s)                                                                                                                                                                                                                                    |
| `options` | `{ root?: string; initializeCoreLocation?: string }` | Specify custom path to `InitializeCore.js` file. `root` and `initializeCoreLocation` are joined together using `path.join`. Defaults: `root` - `process.cwd()`, `initializeCoreLocation` - `node_modules/react-native/Libraries/Core/InitializeCore.js`. |
| _returns_ | `string[]`                                           | Entry file(s) with polyfill paths                                                                                                                                                                                                                        |

### Project configuration reference

Project configuration object (the one accepted by `makeConfig` function) consist of the following properties:

- `server?: ServerConfig` (_optional_) - Specify custom port and host for the packager server:
  - `host?: string` (_optional_) - Host to use for the packager server, defaults to `localhost`.
  - `port?: number` (_optional_) - Port to use for the packager server, defaults to `8081`.
- `platforms?: string[]` (_optional_) - List of supported platforms - useful for defining out-of-tree platforms.  
  Defaults to `['ios', 'android']`.

  When providing the value, you need to specify all of the available platforms, for example to **add** `windows` your need to pass `['windows', 'ios', 'android']`.

- `templates?: TemplateConfig` (_optional_) - Customize templates for given platform:

  - `filename?: { [platform: string]: string }` (_optional_) - Customize bundle filename for given platform.
    If `--bundle-output` is provided, the **filename will be inferred** from it using `path.basename()`, otherwise it will defaults to:

    ```js
    {
      ios: '[bundleName].jsbundle',
      android: '[bundleName].[platform].bundle',
    }
    ```

    You can add your own platform with a template, for example: `{ 'my-platform': '[bundleName].resource' }`.

    You can use `[bundleName]`, `[platform]`, `[mode]` (`prod` or `dev`) and `[type]` (`default`, `app` or `dll`) placeholders in a template.

- `bundles: { [bundleName: string]: BundleConfigBuilder | BundleConfig }` (**required**) - An object where the property name (a key) will become bundle name and a bundle config or a bundle config builder. See below for bundle config reference.

### Bundle configuration reference

Each bundle config can be a plan object or a function that given `env: EnvOptions` and `runtime: Runtime` returns an object.

The bundle configuration consist of the following properties:

- `name?: string` (_optional_) - Overwrite bundle name. Be default bundle name will be inferred from the property in `bundles` object.
- `entry: string | string[]` (**required**) - Path to entry file(s).
- `type?: 'basic-bundle' | 'indexed-ram-bundle' | 'file-ram-bundle'` (_optional_) - Specify bundle type.

  Defaults to `basic-bundle` when using `bundle` command or:

  - `indexed-ram-bundle` for `ram-bundle` command for iOS
  - `file-ram-bundle` for `ram-bundle` command for Android

  When serving files from packager server (`start` command) the `type` will be always set to `basic-bundle`.

- `platform?: string` (_optional_) - Overwrite the platform for which the bundle is built for. By default the platform will be taken form CLI argument `--platform` or provided by packager server.
- `root?: string` (_optional_) - Overwrite the root directory of the project, defaults to `process.cwd()`.
- `dev?: boolean` (_optional_) - Overwrite whether to bundle for production - `false` or development - `true`. By default will use CLI argument `--dev`.
- `assetsDest?: string` (_optional_) - Overwrite the asset output directory. By default will use CLI argument `--assets-dest`.
- `minify?: boolean` (_optional_) - Overwrite whether to minify the code. By default will use CLI argument `--minify` or infer the value from `--dev` argument - when building for production, the minification will be enabled.
- `minifyOptions?: Pick<MinifyOptions, Exclude<keyof MinifyOptions, 'sourceMap'>>` (_optional_) - Provide custom minication options for [Terser](https://github.com/terser-js/terser) except for `sourceMap` which will be provided automatically by Haul.
- `sourceMap?: boolean | 'inline'` (_optional_) - Overwrite whether to create source maps or not. The default value is `true` and the source maps will be emitted to a separate file with `.map` extension. Use `inline`, if you want to have source maps within the bundle (uses Webpack's `EvalSourceMapDevToolPlugin`).
- `dll?: boolean` (_optional_, **multi-bundle mode only**) - Specify if the bundle is a Dynamically Linked Library. Usually bundles that contain common/shared dependencies should be a DLL.
- `app?: boolean` (_optional_, **multi-bundle mode only**) - Specify if the bundle is an Application bundle. Every application bundle should export a root component for rendering as default export.
- `dependsOn?: string[]` (_optional_, **multi-bundle mode only**) - Specify on which DLLs the bundle depends on, which will be automatically linked when building the bundle.
- `providesModuleNodeModules?: Array<string | { name: string; directory: string }>` - Provide custom modules for Haste.
- `hasteOptions?: any` - Provide Haste options.
- `transform?: WebpackConfigTransform` - Customize the Webpack config after it's been created.

  The `transform` function will receive an object with `bundleName`, `env`, `runtime` and Webpack's `config`:

  ```js
  transform: ({bundleName, env, runtime, config}) => {
    runtime.logger.info(
      `Altering Webpack config for bundle ${bundleName} for ${env.platform}`
    );
    // alter the config ...
  };
  ```

  More information can be found in [Customize Webpack config recipe](#customize-webpack-config).

If you want to provide the bundle config based on received CLI arguments, you can do so, by using `BundleConfigBuilder`:

```js
import {makeConfig, withPolyfills} from '@haul-bundler/preset-0.59';

export default makeConfig({
  bundles: {
    index: (env, runtime) => ({
      entry: withPolyfills(env.platform === 'ios' ? './ios.js' : 'android.js'),
    }),
  },
});
```

## Recipes

### Out-of-tree platform

To add support for out-of-tree platform, there are 2 properties that's need to be defined: `platforms` and `templates.filename`.

For the platform `custom`, here's how the config would look like:

```js
import {makeConfig, withPolyfills} from '@haul-bundler/preset-0.59';

export default makeConfig({
  platforms: ['custom'],
  templates: {
    filename: {
      custom: '[bundleName].[platform].bundle', // adjust the template for your needs
    },
  },
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
    },
  },
});
```

This config will allow you to run `bundle`, `ram-bundle` and `multi-bundle` (**experimental**) with `--platform custom`.

Remember that, if the `--bundle-output` is provided, the `templates.filename.custom` won't be used, instead the filename will be inferred from the `--bundle-output` argument.

Please note that by providing `platforms` array, no defaults will be added, meaning `ios` and `android` are no loger supported. To add support for `ios` and `android` alongside `custom` use `['custom', 'ios', 'android']`:

```js
import {makeConfig, withPolyfills} from '@haul-bundler/preset-0.59';

export default makeConfig({
  platforms: ['custom', 'ios', 'android'],
  templates: {
    filename: {
      custom: '[bundleName].[platform].bundle', // adjust the template for your needs
    },
  },
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
    },
  },
});
```

For `ios` and `android` the default filename templates will be used:

```js
{
  ios: '[bundleName].jsbundle',
  android: '[bundleName].[platform].bundle',
}
```

### Customize Webpack config

By default Webpack config is not exposed directly. The only way to customize it, is to use `transform` function, which runs after all other configuration options were normalized and applied to Webpack config - the `transform` function runs at the very end.

```js
import path from 'path';
import { makeConfig, withPolyfills } from "@haul-bundler/preset-0.59";

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./index.js'),
      transform({ bundleName, env, runtime, config }) {
        runtime.logger.info(`Altering Webpack config for bundle ${bundleName}`);
        config.resolve.alias = {
          ...config.resolve.alias,
          'my-alias': path.join(__dirname, 'src/myAlias.js'),
        },
      },
    },
  },
});
```

In `transform` function apart from `bundleName` and Webpack `config`, you have access to:

- `runtime` - Runtime instance, useful for logging via `runtime.logger` ([check here](https://github.com/callstack/haul/blob/next/packages/haul-core/src/runtime/Logger.ts#L38-L42)).
- `env` - Options received from the CLI arguments/options ([check here](https://github.com/callstack/haul/blob/next/packages/haul-core/src/config/types.ts#L14-L26)).

### Multi-bundle mode

Multi-bundle mode is a experimental and not-yet-available in React Native's public releases. Please check [this RFC](https://github.com/react-native-community/discussions-and-proposals/issues/127) and a [PR to React Native](https://github.com/facebook/react-native/pull/25518) for more info.

In order to create multiple bundles, you need to provide bundle configs for them in `bundle` property:

```js
import {makeConfig, withPolyfills} from '@haul-bundler/preset-0.59';

export default makeConfig({
  bundles: {
    index: {
      entry: withPolyfills('./src/host.js'),
      dependsOn: ['base_dll'],
    },
    base_dll: {
      entry: withPolyfills(['react', 'react-native', 'react-navigation']),
      dll: true,
      type: 'indexed-ram-bundle',
    },
    app0: {
      entry: './src/app0',
      dependsOn: ['base_dll'],
      app: true,
      type: 'indexed-ram-bundle',
    },
    app1: {
      entry: './src/app1',
      dependsOn: ['base_dll'],
      app: true,
      type: 'indexed-ram-bundle',
    },
  },
});
```

The config from the example above will create 4 bundles:

- `host` bundle with bootstrapping logic for request and load app bundles.
- `base_dll` bundle with common/shared dependencies between `host`,`app0` and `app1` (as Indexed RAM bundle).
- `app0` bundle with application logic (as Indexed RAM bundle).
- `app1` bundle with application logic (as Indexed RAM bundle).

To build static bundles run `multi-bundle` command instead of `bundle` or `ram-bundle` command. When running `start` command the packager server will automatically detect the multi-bundle mode, so no actions needs to be done here.

The host logic is up to the user to provide, based on the use case, but here's a example implementation:

```js
import React from 'react';
import {AppRegistry, BundleRegistry, View, Text, Linking} from 'react-native';
import {
  createAppContainer,
  createBottomTabNavigator,
  NavigationActions,
} from 'react-navigation';

function makeScreenForAppBundle(bundleName) {
  const screen = props => {
    if (!BundleRegistry.isBundleLoaded(bundleName)) {
      throw new Error(`App bundle ${bundleName} was not loaded`);
    }

    const Component = BundleRegistry.getBundleExport(bundleName);
    return <Component {...props} />;
  };

  return {
    screen,
    navigationOptions: {
      tabBarOnPress: ({navigation, defaultHandler}) => {
        if (BundleRegistry.isBundleLoaded(bundleName)) {
          defaultHandler();
        } else {
          const listener = ({
            bundleName: currentlyLoadedBundle,
            loadStartTimestamp,
          }) => {
            if (currentlyLoadedBundle === bundleName) {
              BundleRegistry.removeListener('bundleLoaded', listener);
              navigation.setParams({loadStartTimestamp});
              defaultHandler();
            }
          };
          BundleRegistry.addListener('bundleLoaded', listener);
          BundleRegistry.loadBundle(bundleName);
        }
      },
    },
  };
}

const AppContainer = createAppContainer(
  createBottomTabNavigator(
    {
      Initial: () => <Text>Initial</Text>,
      app0: makeScreenForAppBundle('app0'),
      app1: makeScreenForAppBundle('app1'),
    },
    {
      initialRouteName: 'Initial',
    }
  )
);

class RootComponent extends React.Component {
  navigatorRef = React.createRef();

  handleURL = event => {
    const [, bundleName] = event.url.match(/.+\/\/(.+)/);
    BundleRegistry.loadBundle(bundleName);
  };

  onBundleLoaded = ({bundleName, loadStartTimestamp}) => {
    if (this.navigatorRef.current) {
      this.navigatorRef.current.dispatch(
        NavigationActions.navigate({
          routeName: bundleName,
          params: {loadStartTimestamp},
        })
      );
    }
  };

  async componentDidMount() {
    BundleRegistry.addListener('bundleLoaded', this.onBundleLoaded);
    Linking.addEventListener('url', this.handleURL);

    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleURL({url: initialUrl});
    }
  }

  componentWillUnmount() {
    Linking.removeListener('url', this.handleURL);
    BundleRegistry.removeListener('bundleLoaded', this.onBundleLoaded);
  }

  render() {
    return (
      <View style={{flex: 1, width: '100%'}}>
        <AppContainer
          ref={this.navigatorRef}
          // we handle deep linking manually
          enableURLHandling={false}
        />
      </View>
    );
  }
}

AppRegistry.registerComponent('MyApp', () => RootComponent);
```
