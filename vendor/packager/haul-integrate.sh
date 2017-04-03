#!/usr/bin/env bash
#
# React Native adds few scripts into Xcode build phase. Some of them
# are defined internally inside React.xcodeproj which makes it impossible
# to receive environmental variables set.
#
# To customise those scripts and make them run `Haul` instead of `packager`,
# we copy our custom versions every time user hits run.

THIS_DIR=$(dirname $0)

PACKAGER_DIR="$(cd "${THIS_DIR}/../../../react-native/packager" && pwd)"

# Copy files
cp -f ${THIS_DIR}/packager.sh ${PACKAGER_DIR}/packager.sh
cp -f ${THIS_DIR}/react-native-xcode.sh ${PACKAGER_DIR}/react-native-xcode.sh

# Set executable permissions
chmod 755 ${PACKAGER_DIR}/packager.sh
chmod 755 ${PACKAGER_DIR}/react-native-xcode.sh