# CLI Commands

## `haul init`

This creates `haul.config.js` file in your project directory which is required by `Haul` to function. The file contains the app's entry point used for creating the app bundle.

See [Configuration](Configuration.md) for more details on `haul.config.js`.

## `haul start`

This starts a webpack development server which will package and serve the JavaScript bundle for your React Native app.

Example: `haul start --platform ios --dev false --minify true --port 3030`

You can specify following parameters to configure the server:

### `--platform <ios|android|all>`

Required parameter which configures the server to build the bundle for the specified platform. `all` will build the bundle for both `android` and `ios` and is slower.

### `--dev <true|false>`

Whether to build in development mode, which sets the global `__DEV__` variable to `true`, and `process.env.NODE_ENV` to `development`. `true` by default.

### `--minify <true|false>`

Whether to minify the bundle while serving. This will make the bundling process slow due to extra minification step, and is `false` by default.

### `--port [number]`

Port on which the server should run. defaults to `8081`.

### `--config [path]`

Path to the webpack Haul config. defaults to `haul.config.js`.

## `haul bundle`

This generates the app bundle and assets for packaging the app.

Example: `haul bundle --platform android --bundle-output build/index.bundle --assets-dest build/assets`

You can specify following parameters to configure the bundle generation:

### `--platform <ios|android>`

The platform to build the bundle for.

### `--dev <true|false>`

Whether to build in development mode. This is `false` by default.

### `--minify <true|false>`

Whether to minify the bundle while serving. This is `true` by default when you are building in production mode.

### `--bundle-output <string>`

Path to use for the bundle file. e.g. - `build/index.android.bundle`.

### `--assets-dest <string>`

Path to the directory to store the assets. e.g. - `build/assets`.

### `--config [path]`

Path to the webpack haul config. defaults to `webpack.haul.js`.
