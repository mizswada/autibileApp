#!/bin/bash
# Xcode Cloud runs this after cloning the repo and before building.
# The repo does not contain node_modules or Pods, so install them here.
set -euo pipefail

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

echo "== Installing Node 20 and CocoaPods"
brew install node@20 cocoapods
export PATH="$(brew --prefix node@20)/bin:$PATH"
node --version
npm --version

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "== Installing JavaScript dependencies"
npm ci --legacy-peer-deps

# Xcode build phases read this file to find node.
echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local

echo "== Installing CocoaPods dependencies"
cd ios
pod install
