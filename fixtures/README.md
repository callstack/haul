# Haul testing fixtures

A set of React Native fixtures for manual testing of Haul. Also used by our
integration tests

## Setup

```
cd fixtures/<desired-fixture>
yarn
yarn haul
```

`yarn haul` command will run local Haul project root directory.

## Building with xcode

For building example with xcode you need to use `yarn link` because xcode get `haul` from local `node_modules` 
