---
id: configuring_your_project
title: Configuring Your Project
---

## Integrating with Xcode

In `Build Phases` edit `Bundle React Native code and images`. It should look like this:

```bash
# added by Haul
export CLI_PATH=node_modules/haul/bin/cli.js
export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

## Integrating with Gradle

If you're on React Native version >= 0.43, run the following to automatically configure your gradle config to use haul:

```
haul init
```

If the automatic setup didn't work for you, you can manually add the following code in `android/app/build.gradle` somewhere before the `apply from: "../../node_modules/react-native/react.gradle"` statement:

```
project.ext.react = [
    cliPath: "node_modules/haul/bin/cli.js"
]
```
