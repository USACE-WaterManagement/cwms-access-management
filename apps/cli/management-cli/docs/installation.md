# CWMS Admin CLI - Installation Guide

The CWMS Admin CLI tool helps you manage users, roles, and authorization policies for the CWMS system.

## Quick Installation

### Option 1: NPM Installation (Recommended)

If you have Node.js installed:

```bash
npm install -g @usace/cwms-admin
```

### Option 2: Download and Install

1. Download the appropriate file for your system:
   - **Mac (Apple Silicon)**: `cwms-admin-v0.1.0-darwin-arm64.tar.gz`
   - **Mac (Intel)**: `cwms-admin-v0.1.0-darwin-x64.tar.gz`
   - **Linux**: `cwms-admin-v0.1.0-linux-x64.tar.gz`
   - **Any platform**: `cwms-admin-v0.1.0-portable.zip`

2. Extract the archive:

   ```bash
   # For .tar.gz files
   tar -xzf cwms-admin-v0.1.0-*.tar.gz

   # For .zip files
   unzip cwms-admin-v0.1.0-portable.zip
   ```

3. Run the installer:

   ```bash
   chmod +x install-from-archive.sh
   ./install-from-archive.sh
   ```

## System Requirements

- **Node.js**: Version 20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Disk Space**: 50MB
- **Operating System**: macOS, Linux, or Windows 10+

To check your Node.js version:

```bash
node --version
```

## Getting Started

After installation, verify it works:

```bash
# Check version
cwms-admin --version

# View available commands
cwms-admin --help

# Login to the system
cwms-admin login -u admin -p your-password

# List users
cwms-admin users list

# View user details
cwms-admin users show username

# List roles
cwms-admin roles list

# View policies
cwms-admin policies list
```

## Configuration

The CLI stores its configuration in `~/.cwms-admin/config.json`

Example configuration:

```json
{
  "apiUrl": "http://localhost:3001",
  "token": "your-auth-token"
}
```

## Troubleshooting

### Command not found

If you see "command not found: cwms-admin", add npm's global bin directory to your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm bin -g)"

# Then reload your shell
source ~/.bashrc  # or source ~/.zshrc
```

### Permission denied

If you get permission errors during npm installation:

```bash
# Use npm's fix for permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Then reinstall
npm install -g @usace/cwms-admin
```

### Cannot connect to API

Check your configuration:

```bash
# View current config
cat ~/.cwms-admin/config.json

# Update API URL
cwms-admin login -u admin -p password -a http://your-api-url:3001
```

## Uninstallation

### If installed via npm

```bash
npm uninstall -g @usace/cwms-admin
```

### If installed manually

```bash
rm -rf ~/.local/lib/cwms-admin
rm ~/.local/bin/cwms-admin
```

## Support

For help or bug reports:

- GitHub Issues: <https://github.com/solidlogix/cwms-access-management/issues>
- Documentation: <https://docs.solidlogix.com/cwms-admin>>
- Email: <support@solidlogix.com>

## Version History

- **v0.1.0** - Initial release with user, role, and policy management
