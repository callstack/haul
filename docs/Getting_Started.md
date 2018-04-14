---
id: getting_started
title: Getting Started
sidebar_label: Add Haul to your project
---

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
yarn haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `webpack.haul.js` to your project, which you can customise to add more functionality.

Next, you're ready to start the development server:

```bash
yarn haul start -- --platform ios
```

Finally, reload your app to update the bundle or run your app just like you normally would:

```bash
react-native run-ios
```

<p align="center">
  <img width="635" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />
</p>
