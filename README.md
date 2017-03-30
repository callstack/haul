<p align="center">
  <img alt="Haul" src="https://cloud.githubusercontent.com/assets/1174278/24502391/25619f98-156b-11e7-994c-a8495b4735d5.png" width="512">
</p>

<p align="center">
  A command line interface for developing React Native applications.
</p>

<p align="center">
<a href="https://circleci.com/gh/callstack-io/haul">  
  <img src="https://circleci.com/gh/callstack-io/haul.svg?style=svg&circle-token=ac39ec56260bd185ed1b5011dab721e35d49557c" /></a>
</p>
---

## Features

**Open:** Haul is a drop-in replacement for `react-native` CLI built on open tools like Webpack.

**Hackable:** Provides a familiar environment by leveraging the Webpack ecosystem.

**Just works:** Built on top of battle tested open source projects, so you never hit annoying issues like symlink support. 

**Helpful:** Designed from the ground up with helpful error messages to increase your productivity.

## Getting started

Start by adding Haul as a dependency to your project:

```bash
yarn add --dev haul-cli
```

To configure your project to use haul, run the following:

```bash
yarn run haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `webpack.haul.js` to your project, which you can customise to add more functionality.

Finally, start the development server:

```bash
yarn run haul start -- --platform ios
```

Now you are ready to start!

<img width="650" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />

## Next steps

Check out [documentation](./docs/README.md) to learn more about available commands and tips on customizing the webpack configuration.

## Limitations

Haul uses a completely different architecture from React Native packager, which means there are some things which don't work quite the same.

We are actively working on adding support for the following:

  - Existing `react-native` commands 
  - React DevTools
  - Developer menu -> Start systrace

The following features are **unlikely to be supported** in the future:

  - Developer menu -> Enable Hot Reloading: use `webpack.haul.js` config instead
  - Haste module system: use something like [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver) instead

## License

[MIT](./LICENSE.md)
