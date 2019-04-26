---
id: configuring_your_project
title: Configuring Your Project
---

## Integrating with Xcode

In `Build Phases` edit `Bundle React Native code and images`. It should look like this:

```bash
# added by Haul
export CLI_PATH=node_modules/@haul/cli/bin/haul.js
export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

There is a mechanism implemented into React Native which tries to ensure that packager (Metro) is always running prior to build. Whenever you run the project and your Haul instance is not running properly you will get a popup with Metro bundler. If you want to disable it (most likely you do) just export `RCT_NO_LAUNCH_PACKAGER` ENV variable in your project. (https://twitter.com/jukben/status/1016706074878119936)

<img src="https://user-images.githubusercontent.com/8135252/42522489-8594b538-846b-11e8-8f7f-80454a47656c.png" width="500"/>

## Integrating with Gradle

If you're on React Native version >= 0.43, run the following to automatically configure your gradle config to use haul:

```
haul init
```

If the automatic setup didn't work for you, you can manually add the following code in `android/app/build.gradle` somewhere before the `apply from: "../../node_modules/react-native/react.gradle"` statement:

```
project.ext.react = [
    cliPath: "node_modules/@haul/cli/bin/haul.js"
]
```
