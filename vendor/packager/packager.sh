#!/usr/bin/env bash
#
# This script is invoked by `launchPackager.command` and will
# start Haul automatically when you run project from Xcode 
#
# This file lives under: node_modules/react-native/packager/packager.sh

# Go to root of the project
cd ../../../

# Execute Haul
node "./node_modules/.bin/haul" start --platform ios "$@"