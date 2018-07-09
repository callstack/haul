#!/usr/bin/env bash

THIS_DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"

DEFAULT_SRC="${THIS_DIR}/../../../react-native/packager"

# Check if react-native/packager exists, for React Native < 0.46
if [ ! -d "${DEFAULT_SRC}" ]; then
  DEFAULT_SRC="${THIS_DIR}/../../../react-native/scripts"
fi

if [ -z "$REACT_NATIVE_XCODE_SRC" ]; then
    REACT_NATIVE_XCODE_SRC="$(cd "${DEFAULT_SRC}" && pwd)";
else
    REACT_NATIVE_XCODE_SRC="$(cd "${THIS_DIR}/${REACT_NATIVE_XCODE_SRC}" && pwd)";
fi

if [ -z "$PACKAGER_SRC" ]; then
    PACKAGER_SRC="$(cd "${DEFAULT_SRC}" && pwd)";
else
    PACKAGER_SRC="$(cd "${THIS_DIR}/${PACKAGER_SRC}" && pwd)";
fi

# Replace local-cli with Haul in `react-native-xcode.sh`
sed -i -e 's|$REACT_NATIVE_DIR/local-cli/cli.js|./node_modules/.bin/haul|' ${REACT_NATIVE_XCODE_SRC}/react-native-xcode.sh

# Replace `react-native start` in `packager.sh`
PACKAGER_CONTENT="cd \"$THIS_DIR/../../../../\" && node \"./node_modules/.bin/haul\" start --platform ios $@"
echo "$PACKAGER_CONTENT" > ${PACKAGER_SRC}/packager.sh