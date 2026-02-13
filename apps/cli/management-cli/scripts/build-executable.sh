#!/bin/bash

# Script to create standalone executables for different platforms
# Requires Node.js 20+ for Single Executable Applications (SEA)

set -e

CLI_NAME=$(node -p "Object.keys(require('./apps/cli/management-cli/package.json').bin)[0]")

echo "Building standalone executable for ${CLI_NAME}..."
echo ""

# Step 1: Prepare distribution
echo "Step 1: Building production version..."
./apps/cli/management-cli/scripts/prepare-dist.sh > /dev/null 2>&1

# Step 2: Bundle everything into a single file
echo "Step 2: Creating single-file bundle..."
cd dist/apps/cli/management-cli

# Create a bundled version with all dependencies
node --experimental-sea-config sea-config.json 2>/dev/null || {
    echo "Note: Node SEA requires Node.js 20+. Using alternative approach..."
}

# Create distribution packages for different platforms
mkdir -p ../../../../release

echo ""
echo "Step 3: Creating distributable archives..."

# Create tarball for Linux/Mac
tar -czf ../../../../release/${CLI_NAME}-v$(node -p "require('./package.json').version")-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m).tar.gz \
    index.js package.json node_modules

echo "  Created: release/${CLI_NAME}-v$(node -p "require('./package.json').version")-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m).tar.gz"

# Create zip for Windows compatibility
cd ../../../..
cd dist/apps/cli/management-cli
zip -q -r ../../../../release/${CLI_NAME}-v$(node -p "require('./package.json').version")-portable.zip \
    index.js package.json node_modules

echo "  Created: release/${CLI_NAME}-v$(node -p "require('./package.json').version")-portable.zip"

cd ../../../..

echo ""
echo "Distribution packages created in ./release/"
echo ""
echo "Distribution options:"
echo ""
echo "1. NPM Installation (requires Node.js on target machine):"
echo "   npm install -g ./dist/apps/cli/management-cli"
echo "   # or"
echo "   npm install -g @usace-watermanagement/${CLI_NAME}"
echo ""
echo "2. Manual Installation from archive:"
echo "   tar -xzf release/${CLI_NAME}-*.tar.gz -C /usr/local/lib/${CLI_NAME}"
echo "   ln -s /usr/local/lib/${CLI_NAME}/index.js /usr/local/bin/${CLI_NAME}"
echo "   chmod +x /usr/local/bin/${CLI_NAME}"
echo ""
