# CWMS Admin CLI - Installation Guide

The CWMS Admin CLI tool helps you manage users, roles, and authorization policies for the CWMS system.

## Quick Installation

### Option 1: NPM Installation (Recommended)

If you have Node.js installed:

```bash
npm install -g @usace-watermanagement/cwms-swims-admin
```

### Option 2: Download and Install

1. Download the appropriate file for your system:
   - **Mac (Apple Silicon)**: `cwms-swims-admin-v0.1.0-darwin-arm64.tar.gz`
   - **Mac (Intel)**: `cwms-swims-admin-v0.1.0-darwin-x64.tar.gz`
   - **Linux**: `cwms-swims-admin-v0.1.0-linux-x64.tar.gz`
   - **Any platform**: `cwms-swims-admin-v0.1.0-portable.zip`

2. Extract the archive:

   ```bash
   # For .tar.gz files
   tar -xzf cwms-swims-admin-v0.1.0-*.tar.gz

   # For .zip files
   unzip cwms-swims-admin-v0.1.0-portable.zip
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
cwms-swims-admin --version

# View available commands
cwms-swims-admin --help

# Login to the system
cwms-swims-admin login -u admin -p your-password

# List users
cwms-swims-admin users list

# View user details
cwms-swims-admin users show username

# List roles
cwms-swims-admin roles list

# View policies
cwms-swims-admin policies list
```

## Configuration

The CLI stores its configuration in `~/.cwms-swims-admin/config.json`

Example configuration:

```json
{
  "apiUrl": "http://localhost:3001",
  "token": "your-auth-token"
}
```

## Troubleshooting

### Command not found

If you see "command not found: cwms-swims-admin", add npm's global bin directory to your PATH:

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
npm install -g @usace-watermanagement/cwms-swims-admin
```

### Cannot connect to API

Check your configuration:

```bash
# View current config
cat ~/.cwms-swims-admin/config.json

# Update API URL
cwms-swims-admin login -u admin -p password -a http://your-api-url:3001
```

## Uninstallation

### If installed via npm

```bash
npm uninstall -g @usace-watermanagement/cwms-swims-admin
```

### If installed manually

```bash
rm -rf ~/.local/lib/cwms-swims-admin
rm ~/.local/bin/cwms-swims-admin
```

## Support

For help or bug reports:

- GitHub Issues: <https://github.com/solidlogix/cwms-access-management/issues>
- Documentation: <https://docs.solidlogix.com/cwms-swims-admin>>
- Email: <support@solidlogix.com>

## Version History

- **v0.1.0** - Initial release with user, role, and policy management
