#!/usr/bin/env bash

THIS_DIR=$(dirname $0)

SCRIPT_SRC="${THIS_DIR}/../../../react-native/packager"
if [ ! -d "${SCRIPT_SRC}" ]; then
  # Check if react-native/packager is exist, for >= 0.46 RN version.
  SCRIPT_SRC="${THIS_DIR}/../../../react-native/scripts"
fi

SRC="$(cd "${SCRIPT_SRC}" && pwd)"

# Replace local-cli with Haul in `react-native-xcode.sh`
sed -i -e 's|$REACT_NATIVE_DIR/local-cli/cli.js|./node_modules/.bin/haul|' ${SRC}/react-native-xcode.sh

# Replace `react-native start` in `packager.sh`
PACKAGER_CONTENT="cd ../../../ && node \"./node_modules/.bin/haul\" start --platform ios \"\$@\""
echo "$PACKAGER_CONTENT" > ${SRC}/packager.sh
