# @haul-bundler/babel-preset-react-native

[![Version][version]][package]   

[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![MIT License][license-badge]][license]
[![Chat][chat-badge]][chat]
[![Code of Conduct][coc-badge]][coc]

Babel preset for __React Native >=0.59.x__ with Haul - Webpack-based React Native bundler.

You can read more about Haul here: https://github.com/callstack/haul.

## API

For easier extendability, `@haul-bundler/babel-preset-react-native` exports a list of functions for getting plugins and default options for them.

Each of the functions below returns an array of `PluginSpec` which is an tuple with plugin name and plugin default options or `undefined`:
```ts
type PluginSpec = [string] | [string, object];
// plugin[0] => plugin name
// plugin[1] => plugin default options
```

To get list of plugins use the following:

- `getDefaultPrePlugins(): PluginSpec[]` - Get list of default plugins to include at the very beginning.
- `getDefaultPostPlugins(): PluginSpec[]` - Get list of default plugins to include at the end, after all other plugins are included.
- `getHermesPlugins(): PluginSpec[]` - Get list of plugins to include when targeting Hermes.
- `getChakraPlugins(): PluginSpec[]` - Get list of plugins to include when targeting ChakraCore.
- `getHaulPlugins(opts: { platform: string }): PluginSpec[]` - Get list of plugins used in Haul.
- `getTsPlugins(opts: { isTSX: boolean }): PluginSpec[]` - Get list of plugins for transpiling TypeScript files (TS/TSX depending on `isTSX` option).
- `getReactNativePlugins(): PluginSpec[]` - Get list of plugins for React Native.
- `getDevelopmentEnvPlugins(): PluginSpec[]` - Get list of plugins for `development` mode - intended to be used in `env.development` in Babel preset.
- `getTestEnvPlugins(): PluginSpec[]`- Get list of plugins for `test` mode - intended to be used in `env.test` in Babel preset.

For convenience, the following util functions are exported as well:

- `isTypeScriptSource(fileName: string): boolean` - returns `true` if the filename is regular TS file (without TSX).
- `isTSXSource(fileName: string): boolean` - returns `true` if the filename is a TSX file.
- `isReactNative(fileName: string): boolean` - returns `true` if the filename is pointing to `react-native` in `node_modules`.

<!-- badges (common) -->

[license-badge]: https://img.shields.io/npm/l/@haul-bundler/babel-preset-react-native.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/haul/blob/master/CODE_OF_CONDUCT.md
[chat-badge]: https://img.shields.io/badge/chat-discord-brightgreen.svg?style=flat-square&colorB=7289DA&logo=discord
[chat]: https://discord.gg/zwR2Cdh

[version]: https://img.shields.io/npm/v/@haul-bundler/babel-preset-react-native.svg?style=flat-square
[package]: https://www.npmjs.com/package/@haul-bundler/babel-preset-react-native
