<i><b>Haul</b> - a command line interface for developing React Native applications.</i>

## Features

**Open:** Haul uses Webpack 2 to bundle your application code and Express.js to serve it to your devices. It is a drop-in replacement for `react-native` CLI built on open tools.

**Hackable:** Haul laverages existing Webpack ecosystem and can be configured just like any other Webpack project. Adding Hot Module Replacement is just a matter of few lines.

**Just works:** Built on top of battle tested open source projects, which makes sure you never hit annoying issues (like symlink support) again. 

**Helpful:** Redesigned from the ground up with self-explanatory error messages to increase your productivity and minimize time spent on debugging issues.

## Getting started

Start by adding Haul as a dependency to your project:

```bash
yarn add haul-cli
```

then, run the following:

```bash
yarn run haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `webpack.haul.js` to your project, which you can customise to add more functionality.

Finally, start the development server:

```bash
yarn run haul start -- --platform ios
```

and follow the instructions!

<img width="650" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />

## Next steps

Check out [documentation](./docs/Readme.md) to learn more about customising your project with Webpack and other available commands. 

## Limitations

Haul has been designed with developer efficiency in mind. It is a complete rewrite of existing `react-native` command line tools. It laverages Webpcak to make your workflow better.

Some features are currently **not supported*:

  - All `react-native` commands but `bundle` and `start` 
  - Support for React DevTools
  - Developer menu: Start systrace
  
Given differences between Webpack and `react-packager` (used by `react-native` to serve your bundle), some of the features are **unlikely to be supported** in the future:

  - Developer menu: Enable Hot Reloading - use `webpack.haul.js` config instead

## License

[MIT](./LICENSE.md)
