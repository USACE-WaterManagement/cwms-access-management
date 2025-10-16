#!/bin/bash

# Installation script for users receiving the tarball
# This script can be included in the distribution archive

set -e

INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/lib/cwms-admin}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

echo "Installing cwms-admin CLI..."
echo ""

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Copy files
echo "Copying files to $INSTALL_DIR..."
cp -r index.js package.json node_modules "$INSTALL_DIR/"

# Create executable wrapper
cat > "$BIN_DIR/cwms-admin" << 'EOF'
#!/bin/bash
NODE_PATH="$HOME/.local/lib/cwms-admin/node_modules" exec node "$HOME/.local/lib/cwms-admin/index.js" "$@"
EOF

chmod +x "$BIN_DIR/cwms-admin"

echo ""
echo "Installation complete!"
echo ""
echo "The 'cwms-admin' command has been installed to: $BIN_DIR/cwms-admin"
echo ""
echo "If you can't run 'cwms-admin' directly, add this to your ~/.bashrc or ~/.zshrc:"
echo "  export PATH=\"\$PATH:$BIN_DIR\""
echo ""
echo "Test the installation:"
echo "  cwms-admin --version"
echo "  cwms-admin --help"
echo ""
