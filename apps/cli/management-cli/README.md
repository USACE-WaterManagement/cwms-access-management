# CWMS Access Management CLI

Command-line interface for managing CWMS authorization policies, users, and roles.

## Documentation

- [Installation Guide](docs/installation.md) - End-user installation and usage
- [Distribution Guide](docs/distribution.md) - Building and distributing to users

## Technology Stack

- [Node.js 24+](https://nodejs.org/) - JavaScript runtime
- [TypeScript 5.6+](https://www.typescriptlang.org/) - Type safety
- [Commander](https://github.com/tj/commander.js) - Command-line argument parsing
- [Table](https://github.com/gajus/table) - Terminal table formatting
- [Ora](https://github.com/sindresorhus/ora) - Terminal spinners
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Pino](https://getpino.io/) - Structured logging
- [Zod](https://zod.dev/) - Schema validation

## Quick Start

```bash
# Build the CLI
pnpm nx build management-cli --configuration=production

# Run the executable
./dist/apps/cli/management-cli/index.js --help

# Try commands
./dist/apps/cli/management-cli/index.js users list
./dist/apps/cli/management-cli/index.js roles list
./dist/apps/cli/management-cli/index.js policies list
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+

### Installation

From the monorepo root:

```bash
pnpm install
```

### Building the Executable

Build for production:

```bash
pnpm nx build management-cli --configuration=production
```

Output location: `dist/apps/cli/management-cli/index.js` (166 KB)

The executable is already marked as executable and includes a shebang, so you can run it directly:

```bash
# Show help
./dist/apps/cli/management-cli/index.js --help

# Show version
./dist/apps/cli/management-cli/index.js --version

# Run commands
./dist/apps/cli/management-cli/index.js users list
```

### Development Mode

Run with hot reload during development:

```bash
# Using Nx
pnpm nx serve management-cli

# Or using tsx directly
cd apps/cli/management-cli
pnpm dev
```

### Installing Globally (Optional)

Install globally to use `cwms-admin` command from anywhere:

```bash
# Link for local development
cd dist/apps/cli/management-cli
npm link

# Now run from anywhere
cwms-admin --help
cwms-admin users list
```

## Available Scripts

- `pnpm nx serve management-cli` - Run in development mode
- `pnpm nx build management-cli` - Build for production
- `pnpm nx lint management-cli` - Run ESLint
- `pnpm nx test management-cli` - Run tests
- `pnpm nx typecheck management-cli` - Run TypeScript type checking

## Usage

You can run commands in two ways:

1. **Direct executable** (from monorepo root):

   ```bash
   ./dist/apps/cli/management-cli/index.js <command>
   ```

2. **Global command** (after `npm link`):
   ```bash
   cwms-admin <command>
   ```

Examples below use the global command format. Replace `cwms-admin` with `./dist/apps/cli/management-cli/index.js` if not
installed globally.

### Authentication

Login to the management API:

```bash
cwms-admin login -u admin -p admin -a http://localhost:3002
# or
./dist/apps/cli/management-cli/index.js login -u admin -p admin -a http://localhost:3002
```

Logout:

```bash
cwms-admin logout
```

The CLI stores authentication tokens in `~/.cwms-admin/config.json`.

### Users

List all users:

```bash
cwms-admin users list
# or
./dist/apps/cli/management-cli/index.js users list
```

Show user details:

```bash
cwms-admin users show <user-id>
# or
./dist/apps/cli/management-cli/index.js users show <user-id>
```

Add a new user (interactive prompts):

```bash
cwms-admin users add
# or
./dist/apps/cli/management-cli/index.js users add
```

Add a new user (with flags):

```bash
cwms-admin users add -u <username> -e <email> -p <password> -n "<full-name>"
```

Remove a user:

```bash
cwms-admin users remove <user-id>
```

Remove a user (skip confirmation prompt):

```bash
cwms-admin users remove <user-id> -y
```

### Roles

List all roles:

```bash
cwms-admin roles list
```

Show role details:

```bash
cwms-admin roles show <role-id>
```

Add a new role (interactive prompts):

```bash
cwms-admin roles add
```

Add a new role (with flags):

```bash
cwms-admin roles add -n <role_name> -d "<description>"
```

Remove a role:

```bash
cwms-admin roles remove <role-id>
```

Remove a role (skip confirmation prompt):

```bash
cwms-admin roles remove <role-id> -y
```

### Policies

List all policies:

```bash
cwms-admin policies list
```

Show policy details:

```bash
cwms-admin policies show <policy-id>
```

### Global Options

```bash
cwms-admin --version
cwms-admin --help
```

## Project Structure

```
src/
├── commands/       # Command implementations
│   ├── users.ts    # User management commands
│   ├── roles.ts    # Role management commands
│   ├── policies.ts # Policy management commands
│   └── login.ts    # Authentication commands
├── services/       # API clients and external services
│   └── api.service.ts  # Management API client
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
│   ├── logger.ts   # Pino logger configuration
│   ├── config.ts   # Configuration management
│   └── version.ts  # Version utilities
└── index.ts        # CLI entry point
```

## Environment Variables

The CLI uses a configuration file stored at `~/.cwms-admin/config.json` for authentication tokens and API URL settings.

You can also set these environment variables for development:

```bash
LOG_LEVEL=info          # Logging level (debug, info, warn, error)
NODE_ENV=development    # Environment (development, production)
```

The API URL is set during login with the `-a` flag (defaults to `http://localhost:3002`).

## Features

- Authentication (login, logout with token storage)
- User management (list, show, create, delete)
- Role management (list, show, create, delete)
- Policy management (list, show)
- Formatted table output with box-drawing characters
- Structured logging with Pino
- Interactive terminal UI with spinners and colored output
- Type-safe API clients with Axios
- Validation with Zod

## Architecture

This CLI follows modern Node.js best practices:

- Commander for command structure and parsing
- Ink for terminal UI with React components
- Custom table component with box-drawing characters
- Ora for loading states and spinners
- Chalk for colored output
- Pino for structured logging
- Modular command structure
- Type-safe with TypeScript
- ESM bundled executable with esbuild

## Testing

Run tests:

```bash
pnpm nx test management-cli
```

The CLI uses Jest for unit testing with full TypeScript support.

## Code Quality

ESLint and Prettier are configured for code quality:

```bash
pnpm nx lint management-cli
```

## Distribution

See the [Distribution Guide](docs/distribution.md) for detailed instructions on building and distributing to users.

Quick summary:

```bash
# Build distribution packages
./apps/cli/management-cli/scripts/build-executable.sh

# Install globally for testing
cd dist/apps/cli/management-cli
npm link
```

## Future Enhancements

- User creation and management
- Role assignment operations
- Policy editing capabilities
- Interactive mode with prompts
- Bulk operations support
- Shell completion scripts
