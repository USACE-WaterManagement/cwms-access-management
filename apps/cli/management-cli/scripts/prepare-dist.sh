#!/bin/bash

# Script to prepare the dist folder for npm publishing or local installation

echo "Building production version..."
pnpm nx build management-cli --configuration=production

echo "Fixing package.json paths..."
cd dist/apps/cli/management-cli

CLI_NAME=$(node -p "Object.keys(require('./package.json').bin)[0]")

# Fix workspace protocol
sed -i.bak 's/"react-devtools-core": "workspace:\^4.28.0"/"react-devtools-core": "^4.28.0"/g' package.json
rm -f package.json.bak

# Ensure bin path is correct
sed -i.bak "s|\"${CLI_NAME}\": \"./dist/apps/cli/management-cli/index.js\"|\"${CLI_NAME}\": \"./index.js\"|g" package.json
rm -f package.json.bak

echo "Installing production dependencies..."
npm install --omit=dev

echo ""
echo "Distribution package ready at: dist/apps/cli/management-cli"
echo ""
echo "To test locally:"
echo "  cd dist/apps/cli/management-cli"
echo "  npm link"
echo "  ${CLI_NAME} --help"
echo ""
echo "To publish to npm:"
echo "  cd dist/apps/cli/management-cli"
echo "  npm publish --access public"
