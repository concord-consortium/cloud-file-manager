#!/bin/bash

# Developed with the help of ChatGPT

# Set the locale for the script to the C locale
export LC_ALL=C

# Path to your package.json file
PACKAGE_JSON_PATH="./package.json"

# Path to TypeScript command
TSC="./node_modules/.bin/tsc"

# Directory containing the files for replacement
DIST_DIR="./dist"

# Use grep with a regular expression to extract the version number
VERSION=$(grep '"version":' "$PACKAGE_JSON_PATH" | sed -E 's/.*"version": "([^"]+)",?/\1/')

if [ -z "$VERSION" ]; then
    echo "Version number not found."
    exit 1
fi

echo -e "\nBuilding the CommonJS library folder..."
$TSC -p tsconfig-cjs.json

echo -e "\nBuilding the ES6 library folder..."
$TSC -p tsconfig-esm.json

# Replace all occurrences of __PACKAGE_VERSION__ in exported files
echo -e "\nSetting the version number to '$VERSION'..."
find "$DIST_DIR/cjs" -type f -exec sed -i '' -e "s/__PACKAGE_VERSION__/$VERSION/g" {} +
find "$DIST_DIR/esm" -type f -exec sed -i '' -e "s/__PACKAGE_VERSION__/$VERSION/g" {} +

echo -e "\nBuild complete\n"
