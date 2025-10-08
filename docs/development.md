# Local Development

This guide covers running the authorization proxy in local development mode with hot reload and debugging capabilities.

## Quick Start

For developers who have completed [first-time setup](setup.md), here's the fastest way to get started:

```bash
# Install tools (if using mise)
mise install

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
./scripts/load-whitelist.sh

# Verify dependent services are running
podman ps | grep -E "cwmsdb|data-api|auth|traefik"

# Start authorization services (containers)
podman compose -f docker-compose.podman.yml up -d

# Verify everything is running
podman ps
curl http://localhost:3001/health
curl http://localhost:3001/cwms-data/offices

# View logs (in separate terminal)
podman logs -f authorizer-proxy
```

## Development Modes

You have multiple options for running the proxy during development:

### Option 1: Run Locally (Recommended for Development)

Run the proxy directly on your machine with hot reload:

```bash
# Start development server with hot reload
pnpm dev

# The proxy will start on http://localhost:3001
# Changes to source files will automatically restart the server
```

**Advantages:**
- Hot reload on file changes
- Direct access to debugger
- Faster iteration cycle
- See logs directly in terminal

**Requirements:**
- OPA and Redis must still run in containers
- CWMS Data API must be accessible

```bash
# Start just OPA and Redis
podman compose -f docker-compose.podman.yml up -d opa redis

# Then run proxy locally
pnpm dev
```

### Option 2: Run with Nx

Use Nx to run specific services with build orchestration:

```bash
# Serve authorizer-proxy with Nx
pnpm nx serve authorizer-proxy

# Run multiple services
pnpm nx run-many --target=serve --all

# Run with specific configuration
pnpm nx serve authorizer-proxy --configuration=development
```

### Option 3: Run in Container

Run the proxy in a container (production-like environment):

```bash
# Build and start all services
podman compose -f docker-compose.podman.yml up -d

# Or build and start in foreground (see logs)
podman compose -f docker-compose.podman.yml up

# View logs
podman logs -f authorizer-proxy
```

See [container-operations.md](container-operations.md) for more container commands.

## Development Workflow

### Making Code Changes

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make changes to source code
# Files are in: apps/services/authorizer-proxy/src/

# Run locally to test
pnpm dev

# Test your changes
curl http://localhost:3001/health
curl http://localhost:3001/cwms-data/offices

# Run linter
pnpm nx lint authorizer-proxy

# Format code
pnpm nx format

# Build to verify it compiles
pnpm nx build authorizer-proxy
```

### Building the Application

The application must be built before running in containers:

```bash
# Build the proxy service
pnpm nx build authorizer-proxy

# Build with production optimizations
pnpm nx build authorizer-proxy --configuration=production

# Build all projects
pnpm nx run-many --target=build --all

# Clean build (remove dist folder)
rm -rf dist
pnpm nx build authorizer-proxy
```

**Note**: The Docker/Podman build process runs `pnpm nx build` automatically during image creation.

### Running Tests

```bash
# Run unit tests
pnpm nx test authorizer-proxy

# Run tests in watch mode
pnpm nx test authorizer-proxy --watch

# Run tests with coverage
pnpm nx test authorizer-proxy --coverage

# Run all tests in workspace
pnpm nx run-many --target=test --all
```

### Linting and Formatting

```bash
# Lint code
pnpm nx lint authorizer-proxy

# Lint and fix
pnpm nx lint authorizer-proxy --fix

# Format code
pnpm nx format

# Check formatting without making changes
pnpm nx format:check

# Lint all projects
pnpm nx run-many --target=lint --all
```

## Development Tools

### Nx Commands

The project uses Nx for monorepo management:

```bash
# Show project graph
pnpm nx graph

# See what will be affected by changes
pnpm nx affected:graph

# Run commands only on affected projects
pnpm nx affected --target=build
pnpm nx affected --target=test

# Clear Nx cache
pnpm nx reset
```

### Debugging

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Authorizer Proxy",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

#### Node Inspector

```bash
# Run with inspector enabled
node --inspect-brk ./dist/apps/services/authorizer-proxy/server.js

# Or use pnpm script
pnpm nx serve authorizer-proxy --inspect
```

Then open `chrome://inspect` in Chrome.

### Environment Variables for Development

Common development configurations:

```bash
# .env.development (create this file)
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001

# Bypass authorization for testing
BYPASS_AUTH=true

# Use local services
CWMS_API_URL=http://localhost:7001/cwms-data
OPA_URL=http://localhost:8181
REDIS_URL=redis://localhost:6379

# Shorter cache for testing
CACHE_TTL_SECONDS=60
```

Load development config:

```bash
# Use development environment
cp .env.development .env

# Or override specific values
BYPASS_AUTH=true pnpm dev
```

## API Documentation

### Generate OpenAPI Specification

```bash
# Start the server first
pnpm dev

# Then generate OpenAPI spec (in another terminal)
pnpm nx run authorizer-proxy:generate:openapi

# Spec will be generated at:
# apps/services/authorizer-proxy/openapi.json
```

**Note**: Interactive Swagger UI is temporarily disabled due to ESM compatibility issues. The OpenAPI JSON spec can be imported into tools like Postman or Insomnia.

## Testing the Proxy

### Health Checks

```bash
# Basic health check
curl http://localhost:3001/health

# Readiness check
curl http://localhost:3001/ready

# Check OPA health
curl http://localhost:8181/health

# Check Redis
podman exec redis-cache redis-cli ping
```

### Test Endpoints

```bash
# Test public endpoint
curl http://localhost:3001/cwms-data/offices

# Test with custom user context (development mode)
curl http://localhost:3001/cwms-data/offices \
  -H 'x-test-user: {"id":"test","username":"testuser","roles":["water_manager"],"offices":["SPK"]}'

# Test with JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=m5hectest" \
  -d "password=m5hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms" \
  | jq -r '.access_token')

curl http://localhost:3001/cwms-data/offices \
  -H "Authorization: Bearer $TOKEN"
```

### View Authorization Headers

```bash
# Check what headers are being sent to downstream API
curl -v http://localhost:3001/cwms-data/offices 2>&1 | grep x-cwms

# View authorization decisions in logs
podman logs -f authorizer-proxy | grep "Authorization decision"
```

## Postman Collection

A complete Postman collection is available for testing:

```bash
# Import into Postman
# File: tools/postman/cwms-authorization.postman_collection.json

# Collection includes:
# - Health checks
# - JWT token retrieval
# - Whitelisted endpoints (OPA enforced)
# - Non-whitelisted endpoints (bypass OPA)
# - Direct API comparison tests
# - Direct OPA policy testing
```

## Hot Reload Configuration

The development server uses nodemon for hot reload. Configuration in `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --watch apps/services/authorizer-proxy/src --ext ts,json --exec 'nx serve authorizer-proxy'"
  }
}
```

Customize watch patterns:

```bash
# Watch specific directories
nodemon --watch src --watch config --exec 'pnpm nx serve authorizer-proxy'
```

## Next Steps

- Review [OPA whitelist configuration](../apps/services/authorizer-proxy/docs/opa-whitelist-guide.md)
- Understand [authentication integration](../apps/services/authorizer-proxy/docs/authentication.md)
- Learn [container operations](container-operations.md)
- Optimize [performance](performance.md)
