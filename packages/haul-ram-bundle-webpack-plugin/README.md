# @haul-bundler/ram-bundle-webpack-plugin

[![Version][version]][package]   

[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![MIT License][license-badge]][license]
[![Chat][chat-badge]][chat]
[![Code of Conduct][coc-badge]][coc]

RAM bundle plugin for Haul and Webpack. This module is intended for internal use.

__When using `@haul-bundler/cli ram-bundle` command, this plugin will be added and configured automatically__, based on passed options.

You can read more about Haul here: https://github.com/callstack/haul.

## API

```ts
import WebpackRamBundlePlugin from '@haul-bundler/ram-bundle-webpack-plugin';

type RamBundleDebugOptions = {
  path: string;
  renderBootstrap?: boolean;
  renderModules?: boolean;
};

type RamBundleConfig = {
  debug?: RamBundleDebugOptions;
  minification?: { enabled: boolean } & Pick<
    MinifyOptions, // Terser minify options
    Exclude<keyof MinifyOptions, 'sourceMap'>
  >;
};

new WebpackRamBundlePlugin({
  sourceMap: true, // whether to generate source maps
  indexRamBundle: true, // whether to build Indexed RAM bundle or File RAM bundle
  preloadBundles: [], // name of bundles to preload when running in multi-bundle mode
  singleBundleMode: true, // whether to run in single-bundle mode or multi-bundle
  config: { // RamBundleConfig
    minification: {
      enabled: true, // whether to minify the source code
      // ... other minifier (Terser) options
    },
  },
});
```

<!-- badges (common) -->

[license-badge]: https://img.shields.io/npm/l/@haul-bundler/ram-bundle-webpack-plugin.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/haul/blob/master/CODE_OF_CONDUCT.md
[chat-badge]: https://img.shields.io/badge/chat-discord-brightgreen.svg?style=flat-square&colorB=7289DA&logo=discord
[chat]: https://discord.gg/zwR2Cdh

[version]: https://img.shields.io/npm/v/@haul-bundler/ram-bundle-webpack-plugin.svg?style=flat-square
[package]: https://www.npmjs.com/package/@haul-bundler/ram-bundle-webpack-plugin
