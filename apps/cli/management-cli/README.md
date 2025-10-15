# CWMS Access Management CLI

Command-line interface for managing CWMS authorization policies, users, and roles.

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
./dist/apps/cli/management-cli/index.cjs --help

# Try commands
./dist/apps/cli/management-cli/index.cjs users list
./dist/apps/cli/management-cli/index.cjs roles list
./dist/apps/cli/management-cli/index.cjs policies list
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

Output location: `dist/apps/cli/management-cli/index.cjs` (166 KB)

The executable is already marked as executable and includes a shebang, so you can run it directly:

```bash
# Show help
./dist/apps/cli/management-cli/index.cjs --help

# Show version
./dist/apps/cli/management-cli/index.cjs --version

# Run commands
./dist/apps/cli/management-cli/index.cjs users list
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
   ./dist/apps/cli/management-cli/index.cjs <command>
   ```

2. **Global command** (after `npm link`):
   ```bash
   cwms-admin <command>
   ```

Examples below use the global command format. Replace `cwms-admin` with `./dist/apps/cli/management-cli/index.cjs` if not installed globally.

### Authentication

Login to the management API:

```bash
cwms-admin login -u admin -p admin -a http://localhost:3002
# or
./dist/apps/cli/management-cli/index.cjs login -u admin -p admin -a http://localhost:3002
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
./dist/apps/cli/management-cli/index.cjs users list
```

Show user details:

```bash
cwms-admin users show <username>
# or
./dist/apps/cli/management-cli/index.cjs users show <username>
```

### Roles

List all roles:

```bash
cwms-admin roles list
```

Show role details:

```bash
cwms-admin roles show <role>
```

### Policies

List all policies:

```bash
cwms-admin policies list
```

Show policy details:

```bash
cwms-admin policies show <name>
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
- User management (list, show)
- Role management (list, show)
- Policy management (list, show)
- Formatted table output with box-drawing characters
- Structured logging with Pino
- Interactive terminal UI with spinners and colored output
- Type-safe API clients with Axios
- Validation with Zod

## Architecture

This CLI follows modern Node.js best practices:

- Commander for command structure and parsing
- Table package for formatted terminal tables
- Ora for loading states and spinners
- Chalk for colored output
- Pino for structured logging
- Modular command structure
- Type-safe with TypeScript
- CommonJS bundled executable with esbuild

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

To create a standalone executable:

1. Build with production configuration:
   ```bash
   pnpm nx build management-cli --configuration=production
   ```

2. The output includes a shebang for direct execution
3. Make it executable:
   ```bash
   chmod +x dist/apps/cli/management-cli/index.js
   ```

4. Optional: Bundle with pkg or ncc for true single-binary distribution

## Future Enhancements

- Interactive mode with prompts
- Bulk operations support
- Configuration file support
- Shell completion scripts
- User creation and management
- Role assignment operations
- Policy editing capabilities
- Enhanced table formatting with custom themes
