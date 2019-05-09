# @haul-bundler/inspector

[![Version][version]][package]   

[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![MIT License][license-badge]][license]
[![Chat][chat-badge]][chat]
[![Code of Conduct][coc-badge]][coc]

CLI tool for inspecting running `@haul-bundler/cli` process, which could have been spawned indirectly/implicitly.

## Usage

### Installation

```bash
yarn add @haul-bundler/inspector
# or
yarn global add @haul-bundler/inspector
```

### Running

```bash
yarn haul-inspector [options]
# or (if installed globally)
haul-inspector [options]
```

### Options

* `--port` (`number`) - Port on which to listen for `@haul-bundler/cli` processes. Default: `7777`.
* `--host` (`string`) - Host on which to listen for `@haul-bundler/cli` processes. Default: `localhost`

Please remember to use correct `HAUL_INSPECTOR_PORT`/`HAUL_INSPECTOR_PORT`/`HAUL_INSPECTOR_HOST`, when using custom `--port` or `--host` options.

You can read moe about Haul here: https://github.com/callstack/haul.

<!-- badges (common) -->

[license-badge]: https://img.shields.io/npm/l/@haul-bundler/inspector.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/haul/blob/master/CODE_OF_CONDUCT.md
[chat-badge]: https://img.shields.io/badge/chat-discord-brightgreen.svg?style=flat-square&colorB=7289DA&logo=discord
[chat]: https://discord.gg/zwR2Cdh

[version]: https://img.shields.io/npm/v/@haul-bundler/inspector.svg?style=flat-square
[package]: https://www.npmjs.com/package/@haul-bundler/inspector