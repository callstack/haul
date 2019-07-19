# `haul` migration gide

The following guide describes how to migrate from any version `haul` package to `@haul-bundler/cli`.

1. Backup old `haul.config.js` and `babel.config.js`/`.babelrc`.
2. Install `@haul-bundler/cli`:
   ```bash
   yarn add -D @haul-bundler/cli
   # or
   npm install --save-dev @haul-bundler/cli
   ```
3. Run `init` command:
   ```bash
   yarn haul init
   # or
   npx haul init
   ```
4. Integrate Webpack modifications from old configuration to a [new one](./Configuration.md#project-configuration-reference) using [`transform`](./Configuration.md#customize-webpack-config) property if needed.
5. If you have custom/additional Babel presets or plugins in old `babel.config.js`/`.babelrc`, add them to `babel.config.js`.
6. Remove HMR related logic, if you were using HMR, since we don't support it anymore.

