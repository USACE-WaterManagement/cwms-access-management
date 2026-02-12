# CWMS Admin CLI - Distribution Guide

This guide covers how to build and distribute the cwms-swims-admin CLI tool to your users.

## Prerequisites

- Node.js 20+ installed on your development machine
- pnpm package manager
- Access to the cwms-access-management monorepo

## Building Distribution Packages

### Quick Build

Run the automated build script:

```bash
./apps/cli/management-cli/scripts/build-executable.sh
```

This creates distribution packages in the `./release/` directory:

- `cwms-swims-admin-v{version}-{os}-{arch}.tar.gz` - Platform-specific tarball
- `cwms-swims-admin-v{version}-portable.zip` - Cross-platform ZIP archive

### Manual Build Steps

If you prefer to build manually:

```bash
# 1. Build production version
pnpm nx build management-cli --configuration=production

# 2. Navigate to dist folder
cd dist/apps/cli/management-cli

# 3. Fix package.json (if needed)
sed -i 's/"react-devtools-core": "workspace:\^4.28.0"/"react-devtools-core": "^4.28.0"/g' package.json

# 4. Install production dependencies
npm install --omit=dev

# 5. Create tarball
tar -czf cwms-swims-admin.tar.gz index.js package.json node_modules
```

## Distribution Methods

### Method 1: NPM Global Installation (Recommended)

**Distribution:**

```bash
# Option A: Publish to npm registry (public or private)
cd dist/apps/cli/management-cli
npm publish --access public

# Option B: Share the dist folder directly
zip -r cwms-swims-admin-npm.zip dist/apps/cli/management-cli
```

**User Installation:**

```bash
# From npm registry
npm install -g @usace-watermanagement/cwms-swims-admin

# From local folder/archive
npm install -g ./cwms-swims-admin-npm
```

**User Usage:**

```bash
cwms-swims-admin --version
cwms-swims-admin --help
cwms-swims-admin users list
```

### Method 2: Portable Archive

**Distribution:** Share the generated tarball or zip file:

- `release/cwms-swims-admin-v0.1.0-darwin-arm64.tar.gz` (Mac ARM)
- `release/cwms-swims-admin-v0.1.0-portable.zip` (All platforms)

**User Installation (Linux/Mac):**

```bash
# Extract archive
tar -xzf cwms-swims-admin-v0.1.0-*.tar.gz

# Run the installation script
chmod +x install-from-archive.sh
./install-from-archive.sh

# Or manual installation
sudo mkdir -p /usr/local/lib/cwms-swims-admin
sudo cp -r index.js package.json node_modules /usr/local/lib/cwms-swims-admin/
sudo ln -s /usr/local/lib/cwms-swims-admin/index.js /usr/local/bin/cwms-swims-admin
sudo chmod +x /usr/local/bin/cwms-swims-admin
```

**User Installation (Windows):**

```powershell
# Extract ZIP to C:\Program Files\cwms-swims-admin
# Add to PATH or create a batch wrapper:
@echo off
node "C:\Program Files\cwms-swims-admin\index.js" %*
```

## Package Contents

Each distribution package includes:

```text
cwms-swims-admin/
├── index.js           # 34KB bundled application (ESM format)
├── package.json       # Package metadata and dependencies
└── node_modules/      # Production dependencies (~8-10MB)
    ├── ink/           # Terminal UI framework
    ├── commander/     # CLI argument parsing
    ├── axios/         # HTTP client
    ├── chalk/         # Terminal colors
    ├── ora/           # Spinners
    ├── pino/          # Logging
    └── ...            # Other dependencies
```

**Total size:** ~8.5MB (tarball), ~10MB (uncompressed)

## Version Management

Update version before building:

```bash
# In apps/cli/management-cli/package.json
{
  "name": "@usace-watermanagement/cwms-swims-admin",
  "version": "0.2.0",  # Update this
  ...
}
```

## Testing Distribution Packages

Before distributing, test the package:

```bash
# Test tarball extraction
tar -xzf release/cwms-swims-admin-*.tar.gz -C /tmp/test
cd /tmp/test
node index.js --version
node index.js users list

# Test npm installation
npm install -g ./dist/apps/cli/management-cli
cwms-swims-admin --help
npm uninstall -g @usace-watermanagement/cwms-swims-admin
```

## User System Requirements

**Minimum Requirements:**

- Node.js 20.0.0 or higher
- 50MB free disk space
- Terminal with Unicode support (for table rendering)

**Recommended:**

- Node.js 24.0.0 or higher
- macOS, Linux, or Windows 10+
- Terminal with color support

## Troubleshooting

### "command not found: cwms-swims-admin"

**Solution:** Add npm global bin directory to PATH:

```bash
# Find npm global bin directory
npm bin -g

# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm bin -g)"
```

### "Cannot find module 'commander'"

**Solution:** Dependencies not installed. Run:

```bash
cd /path/to/cwms-swims-admin
npm install --omit=dev
```

### Table rendering issues

**Solution:** Ensure terminal supports Unicode:

```bash
# Check locale
echo $LANG  # Should include UTF-8

# Set if needed
export LANG=en_US.UTF-8
```

## Security Considerations

- **Never include secrets** in the distribution package
- **Validate checksums** for distributed files
- **Sign releases** if distributing publicly
- **Use private npm registry** for internal tools

## Support

For issues or questions:

- GitHub: <https://github.com/solidlogix/cwms-access-management>
- Email: <support@solidlogix.com>
