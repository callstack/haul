---
id: codepush
title: Integrating Haul with CodePush
---

## What is CodePush?

[CodePush](http://microsoft.github.io/code-push/) is a cloud service that gives developers an ability to send mobile app updates directly to their users' devices. Note that we can CodePush only new JS Bundle and assets.


## Installation

This doc assumes You successfully installed Haul in Your app. If not, [please use the installation guide.](https://github.com/callstack-io/haul#getting-started)

To install and enable CodePush, please refer to the [Official CodePush docs](http://microsoft.github.io/code-push/) up to step 4, included.


## Using CodePush with Haul

To release a new update, we have to bundle our app, then use CodePush CLI to send it to our users.


### Bundling

There are two bundle methods: with or without assets. Refer to table below to see which Haul command You should use:

| Platform/option   | Command                                                                                                                                           |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Android wo/assets | haul bundle --platform android --entry-file \<entryFile> --bundle-output \<outputDir>/index.android.bundle --dev false                            |
| Android w/assets  | haul bundle --platform android --entry-file \<entryFile> --bundle-output \<outputDir>/index.android.bundle --assets-dest \<outputDir> --dev false |
| iOS wo/assets     | haul bundle --platform ios --entry-file \<entryFile> --bundle-output \<outputDir>/main.jsbundle --dev false                                       |
| iOS w/assets      | haul bundle --platform ios --entry-file \<entryFile> --bundle-output \<outputDir>/main.jsbundle --assets-dest \<outputDir> --dev false            |

<sub>
  Notes:


  1. `<entryFile>` is either `index.android.js` (for Android), `index.ios.js` (for iOS), or other entry file

  2. `<outputDir>` is Your defined output bundle directory, each platform should be separated

  3. Don't change `index.android.bundle` (android) or `main.jsbundle` filename as those names are **required** for update to work

</sub>

### Release update

Using CodePush CLI:


`code-push release <appName> <outputDir> <version> <options>`


<sub>
  Notes:

  1. `<appName>` is registered App name with CodePush service ( step 3 in official docs )

  2. `<outputDir>` is directory You provided in Bundling step

  3. `<version>` is Your app version You want to target with this update

  4. `<options>` are other options You pass to CodePush

</sub>
