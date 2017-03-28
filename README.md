<i><b>Haul</b> - Haul is a command line interface for developing React Native applications.</i>

## Features

**Open:** Haul uses Webpack 2 to bundle your application code and Express.js to serve it to your devices. It is a drop-in replacement for `react-native` CLI built on open tools.

**Hackable:** Haul laverages existing Webpack ecosystem and can be configured just like any other Webpack project. Adding Hot Module Replacement is just a matter of few lines.

**Just works:** Built on top of battle tested open source projects, which makes sure you never hit annoying issues (like symlink support) again. 

**Helpful:** Redesigned from the ground up with self-explanatory error messages to increase your productivity and minimize time spent on debugging issues.

## Installing Haul

Start by adding Haul as a dependency to your project:

```bash
yarn add haul-cli
```

then, run the following:

```bash
yarn run haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `webpack.haul.js` to your project, which you can customise to add more functionality.

Finally, just start the development server:

```bash
yarn run haul start -- --platform ios
```

and follow the instructions!

<img width="500" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />
