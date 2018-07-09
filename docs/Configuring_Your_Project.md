---
id: configuring_your_project
title: Configuring Your Project
---

## Integrating with Xcode

Add a new Run Script phase to your project's main target.

![](./img/xcode-integration-1.png)

Click on its default "Run Script" label to set its name to something like "Integrate Haul with React Native".

![](./img/xcode-integration-2.png)

Add the following command to the script:

```
bash ../node_modules/haul/src/utils/haul-integrate.sh
```

Usually, a React Native project has a run script phase that runs `react-native-xcode.sh`. This phase is added during initial integration with RN. Due to the fact that `haul-integrate.sh` rewrites parts of `react-native-xcode.sh`, the new build phase should be run before the existing build phase:

![](./img/xcode-integration-3.png)

In case you rely on a library that uses their own custom `react-native-xcode.sh` or `package.sh` script, you may provide their paths to Haul by exporting the variables `REACT_NATIVE_XCODE_SRC` or `PACKAGER_SRC`. 

To achieve this you should do the following:
```
export REACT_NATIVE_XCODE_SRC="../../../react-native-schemes-manager/lib"
bash ../node_modules/haul/src/utils/haul-integrate.sh
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
