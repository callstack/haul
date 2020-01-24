# @haul-bundler/explore

[![Version][version]][package]   

[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![MIT License][license-badge]][license]
[![Chat][chat-badge]][chat]
[![Code of Conduct][coc-badge]][coc]

Wrapper for [source-map-explorer](https://github.com/danvk/source-map-explorer) that allows you to explore and analyse regular and RAM bundles for React Native.

## Usage

Install module:

```bash
yarn add -D @haul-bundler/explore
```

Then you can run:

```bash
yarn haul-explore <bundle_path> <source_map_path> --[html | tsv | json] [filename]
```

- `<bundle_path>` and `<source_map_path>` are required
- Output type (`html | tsv | json`) is optional and set to `html` by default
- If `filename` is specified with output type (`html | tsv | json`), the results will be saved to specified file, otherwise the results it will be shown in the browser

## Examples

### Regular iOS bundle

```bash
yarn haul-explore dist/main.jsbundle dist/main.jsbundle.map
```

### Indexed RAM bundle (default RAM bundle for iOS)

```bash
yarn haul-explore dist/main.jsbundle dist/main.jsbundle.map
```

### File RAM bundle (default RAM bundle for Arndroid)

```bash
yarn haul-explore dist/index.android.bundle dist/index.android.bundle.map
```

<!-- badges (common) -->

[license-badge]: https://img.shields.io/npm/l/@haul-bundler/explore.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/haul/blob/master/CODE_OF_CONDUCT.md
[chat-badge]: https://img.shields.io/badge/chat-discord-brightgreen.svg?style=flat-square&colorB=7289DA&logo=discord
[chat]: https://discord.gg/zwR2Cdh

[version]: https://img.shields.io/npm/v/@haul-bundler/explore.svg?style=flat-square
[package]: https://www.npmjs.com/package/@haul-bundler/explore