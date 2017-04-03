#!/bin/bash

# Bundles React Native code and images for offline use.
#
# This script is supposed to be called as a part of Xcode build process
# and relies on its environment variables.
#
# Adopted from:
# https://github.com/facebook/react-native/blob/master/packager/react-native-xcode.sh

case "$CONFIGURATION" in
  Debug)
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      echo "Skipping bundling for Simulator platform"
      exit 0;
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

# Locate absolute path to Haul directory
HAUL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Move two levels up to React Native project
cd "${HAUL_DIR}"/../..

# Path to folder where to save assets and bundle
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

# In Debug mode for non simulators, automatically detect IP address
if [[ "$CONFIGURATION" = "Debug" && ! "$PLATFORM_NAME" == *simulator ]]; then
  PLISTBUDDY='/usr/libexec/PlistBuddy'
  PLIST=$TARGET_BUILD_DIR/$INFOPLIST_PATH
  IP=$(ipconfig getifaddr en0)
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | cut -d\   -f2  | awk 'NR==1{print $1}')
  fi
  $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
  $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:$IP.xip.io:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
  echo "$IP.xip.io" > "$DEST/ip.txt"
fi

# Execute Haul
"$HAUL_DIR/bin/cli.js" bundle \
  --platform ios \
  --dev $DEV \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST"