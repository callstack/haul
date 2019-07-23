---
id: cli
title: CLI Commands
---

### Global options

* `--verbose` - Print all messages including debug logs.
* `--haul-inspector <true|false|"wait">` - Make Haul process attach to Haul inspector (use `wait` to make Haul process to wait for connection with inspector before proceeding). Check [Using Haul inspector recipe](./Recipes.md#using-haul-inspector) for more info.
* `--node-inspector <true|false|"wait">` - Make Haul process attach to Node debugger, similar to passing `--inspect` options (use `wait` for make Haul process to wait for connection with Node debugger before proceeding, similar to passing `--inspect-brk`). Check [Debugging Haul process recipe](./Recipes.md#debugging-haul-process) for more info.

## `haul init`

This creates `haul.config.js` file in your project directory which is required by `Haul` to function. The file contains the app's entry point used for creating the app bundle.

See [Configuration](Configuration.md) for more details on `haul.config.js`.

## `haul start`

This starts a packager server, which will build and serve the JavaScript development bundle for your React Native app.

Example: `haul start --port 3030`

You can specify following parameters to configure the server:

#### `--eager <ios,android,...|true>`

When present, the server will start compilation for given platforms without waiting for first request from the app.

Examples:

```bash
yarn haul start --eager ios # Prebuild bundle for iOS only
yarn haul start --eager # Prebuild bundle for all platforms
yarn haul start --eager ios,windows # Prebuild bundle for iOS and Windows only
```

#### `--dev <true|false>`

Whether to build in development mode, which sets the global `__DEV__` variable to `true`, and `process.env.NODE_ENV` to `development`. `true` by default.

#### `--minify <true|false>`

Whether to minify the bundle while serving. This will make the bundling process slow due to extra minification step, and is `false` by default.

#### `--port [number]`

Port on which the server should run. Defaults to `8081`.

#### `--temp-dir <string>`

Path to directory where to store temporary files. By default Haul will use a random temporary directory provided by the OS.

#### `--config [path]`

Path to Haul config. Defaults to `haul.config.js`.

### `--interactive <true|false>`

If `false`, disables any user prompts and prevents the UI (which requires a TTY session) from being rendered - useful when running on CI. Defaults to `true`.

Alternative usage: `--no-interactive` (the same as `--interactive false`).

## `haul bundle`

This generates the app bundle and assets for packaging the app.

Example: `haul bundle --platform android --bundle-output build/index.bundle --assets-dest build/assets`

You can specify following parameters to configure the bundle generation:

#### `--platform <string>`

The platform to build the bundle for.

#### `--dev <true|false>`

Whether to build in development mode. This is `false` by default.

#### `--minify <true|false>`

Whether to minify the bundle while serving. This is `true` by default when you are building in production mode.

#### `--entry-file <string>`

Path to the root JS file, either absolute or relative to JS root, e.g. - `./src/index.js`.

#### `--bundle-output <string>`

Path to use for the bundle file. e.g. - `build/index.android.bundle`.

#### `--assets-dest <string>`

Path to the directory to store the assets. e.g. - `build/assets`.

#### `--sourcemap-output <string>`

Path to use for a source map file, e.g. - `build/index.android.bundle.map`.

#### `--config [path]`

Path to the webpack haul config. Defaults to `haul.config.js`.

## `haul ram-bundle`

Generate the app bundle as a Random Access Memory bundle. For iOS platform (`--platform ios`) the bundle is a Indexed RAM bundle, where all JavaScript modules are contained in a single file. For Android (`--platform android`) the bundle is a File RAM bundle - the JS modules are stored separately in `js-modules` directory. You can overwrite this behavior by passing `--indexed-ram-bundle`, which will force Haul to create Indexed RAM bundle for Android.

You can read more about RAM bundles here: https://facebook.github.io/react-native/docs/performance#enable-the-ram-format

Example: `haul ram-bundle --platform android --bundle-output build/index.bundle --assets-dest build/assets`

You can specify following parameters to configure the bundle generation:

#### `--indexed-ram-bundle`

Force the "Indexed RAM" bundle file format, even when building for android.

#### `--platform <ios|android>`

The platform to build the bundle for.

#### `--dev <true|false>`

Whether to build in development mode. This is `false` by default.

#### `--entry-file <string>`

Path to the root JS file, either absolute or relative to JS root, e.g. - `./src/index.js`.

#### `--minify <true|false>`

Whether to minify the bundle while serving. This is `true` by default when you are building in production mode.

#### `--bundle-output <string>`

Path to use for the bundle file. e.g. - `build/index.android.bundle`.

#### `--assets-dest <string>`

Path to the directory to store the assets. e.g. - `build/assets`.

#### `--sourcemap-output <string>`

Path to use for a source map file, e.g. - `build/index.android.bundle.map`.

#### `--config [path]`

Path to the webpack haul config. defaults to `haul.config.js`.

## `reload`

Sends reload request to all devices that enabled live reload.

#### `--port <number>`

Port on which the packager server is running. Defaults to `8081`.