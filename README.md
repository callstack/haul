<p align="center">
  <img alt="Haul" src="https://cloud.githubusercontent.com/assets/1174278/24502391/25619f98-156b-11e7-994c-a8495b4735d5.png" width="512">
</p>

<p align="center">
  A command line tool for developing React Native apps
</p>

---

<a title="Join on Slack" href="https://slack.callstack.io/"><img src="https://slack.callstack.io/badge.svg" /></a>

Haul is a drop-in replacement for `react-native` CLI built on open tools like Webpack. It can act as a development server or bundle your React Native app for production.

## Features

- Replaces React Native packager to bundle your app
- Access to full webpack ecosystem, using additonal loaders and plugins is simple
- Doesn't need watchman, symlinks work nicely
- Helpful and easy to understand error messages
- Hot Module Reloading

## Getting started

Start by adding Haul as a dependency to your React Native project (use `react-native init MyProject` to create one if you don't have a project):

```bash
yarn add --dev haul
```

If you're on a React Native version >= 0.43, add the following in `android/app/build.gradle` somewhere before the `apply from: "../../node_modules/react-native/react.gradle"` statement:

```
project.ext.react = [
    cliPath: "node_modules/haul/bin/cli.js"
]
```

To configure your project to use haul, run the following:

```bash
yarn run haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `webpack.haul.js` to your project, which you can customise to add more functionality.

Next, you're ready to start the development server:

```bash
yarn run haul start -- --platform ios
```

Finally, reload your app to update the bundle or run your app just like you normally would:

```bash
react-native run-ios
```

<p align="center">
  <img width="635" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />
</p>

## Documentation

Check out the docs to learn more about available commands and tips on customizing the webpack configuration.

1. [CLI Commands](docs/CLI%20Commands.md)
1. [Configuration](docs/Configuration.md)
1. [Recipes](docs/Recipes.md)

### Hot Module Replacement
Please refear to the [Setup guide](./docs/hmr/Setup.md).

## Limitations

Haul uses a completely different architecture from React Native packager, which means there are some things which don't work quite the same.

We are actively working on adding support for the following:

- Existing `react-native` commands

The following features are **unlikely to be supported** in the future:

- Haste module system: use something like [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver) instead
- Transpile files under `node_modules`: transpile your modules before publishing, or configure webpack not to ignore them

## License

[MIT](./LICENSE.md)
