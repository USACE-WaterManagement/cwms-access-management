# AGENTS.md - CWMS Access Management

## Build/Test Commands
- `pnpm build` - Build all apps using Nx
- `pnpm lint` - Lint all code using ESLint
- `pnpm run-all` - Start all services in parallel
- `nx test <app-name>` - Run tests for a specific app
- `nx build <app-name>` - Build a specific app
- `nx lint <app-name>` - Lint a specific app

## Code Style Guidelines
- **Imports**: Use sorted imports with newlines between groups (external, internal). React imports first for React files.
- **Formatting**: Prettier with 120 char line width, single quotes, trailing commas, 2-space indentation
- **Types**: TypeScript strict mode enabled. Use explicit types, avoid `any` (warn level)
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use proper error handling with try/catch blocks and meaningful error messages
- **Architecture**: Nx monorepo with TypeScript, Fastify for API, ES modules
- **Linting**: ESLint with TypeScript plugin, sorted imports, newline before return statements
- **File Structure**: Use `apps/` for applications, maintain proper separation of concerns
- **Dependencies**: Use pnpm for package management, Fastify for server framework
- **Code Quality**: No unused variables, meaningful variable names, consistent code organization