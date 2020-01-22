# @haul-bundler/explore

Wrapper for source-map-explorer that allows you to explore and analyse RAM React Native bundles

Under the hood it is using source-map-explorer by danvk

You can read more about source-map-explorer here: https://github.com/danvk/source-map-explorer.

## Usage

Installation:

```bash
yarn add @haul-bundler/explore
```

Usage:

```bash
yarn haul-explore <bundle path> <source.map path> --[html | tsv | json] [file]
```

Bundle path and source map path are required. Output type is optional (html by default)

If you want to use it with file ram bandle, you need to pass path to UNBUNDLE as 'bundle path'

If filename specified output will be saved to specified file otherwise it will be opened in browser.
