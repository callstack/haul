#!/usr/bin/env bash

THIS_DIR=$(dirname $0)

SRC="$(cd "${THIS_DIR}/../../../react-native/packager" && pwd)"

# Replace local-cli with Haul in `react-native-xcode.sh`
sed -i -e 's|$REACT_NATIVE_DIR/local-cli/cli.js|./node_modules/.bin/haul|' ${SRC}/react-native-xcode.sh

# Replace `react-native start` in `packager.sh`
PACKAGER_CONTENT="cd ../../../ && node \"./node_modules/.bin/haul\" start --platform ios \"\$@\""
echo "$PACKAGER_CONTENT" > ${SRC}/packager.sh