#!/bin/bash

# Installation script for users receiving the tarball
# This script can be included in the distribution archive

set -e

CLI_NAME=$(node -p "Object.keys(require('./package.json').bin)[0]")

INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/lib/${CLI_NAME}}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

echo "Installing ${CLI_NAME} CLI..."
echo ""

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Copy files
echo "Copying files to $INSTALL_DIR..."
cp -r index.js package.json node_modules "$INSTALL_DIR/"

# Create executable wrapper
cat > "$BIN_DIR/${CLI_NAME}" << EOF
#!/bin/bash
NODE_PATH="$INSTALL_DIR/node_modules" exec node "$INSTALL_DIR/index.js" "\$@"
EOF

chmod +x "$BIN_DIR/${CLI_NAME}"

echo ""
echo "Installation complete!"
echo ""
echo "The '${CLI_NAME}' command has been installed to: $BIN_DIR/${CLI_NAME}"
echo ""
echo "If you can't run '${CLI_NAME}' directly, add this to your ~/.bashrc or ~/.zshrc:"
echo "  export PATH=\"\$PATH:$BIN_DIR\""
echo ""
echo "Test the installation:"
echo "  ${CLI_NAME} --version"
echo "  ${CLI_NAME} --help"
echo ""
