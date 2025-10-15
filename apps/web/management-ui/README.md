# CWMS Access Management UI

Read-only web interface for viewing and managing CWMS authorization policies, users, and roles.

## Technology Stack

- [React 18.3.1](https://react.dev/) - UI library
- [Vite 6.x](https://vite.dev/) - Build tool and dev server
- [TypeScript 5.6+](https://www.typescriptlang.org/) - Type safety
- [React Router v7](https://reactrouter.com/) - Client-side routing
- [TanStack Query v5](https://tanstack.com/query/latest) - Data fetching and caching
- [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first styling
- [Pino](https://getpino.io/) - Structured logging
- [Vitest](https://vitest.dev/) - Testing framework
- [MSW](https://mswjs.io/) - API mocking

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm nx serve management-ui
```

The app will be available at [http://localhost:4200](http://localhost:4200)

### Building

Build for production:

```bash
pnpm nx build management-ui --configuration=production
```

Output will be in `dist/apps/web/management-ui`

### Preview Production Build

```bash
pnpm nx preview management-ui
```

Available at [http://localhost:4300](http://localhost:4300)

## Available Scripts

- `pnpm nx serve management-ui` - Start development server
- `pnpm nx build management-ui` - Build for production
- `pnpm nx preview management-ui` - Preview production build
- `pnpm nx lint management-ui` - Run ESLint
- `pnpm nx test management-ui` - Run tests
- `pnpm nx test management-ui --coverage` - Run tests with coverage
- `pnpm nx typecheck management-ui` - Run TypeScript type checking

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components for routing
├── services/       # API clients and external services
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_URL=http://localhost:3001
VITE_LOG_LEVEL=info
VITE_ENABLE_MSW=false
```

## Features

- View users and their assigned roles
- View role definitions and permissions
- View OPA authorization policies
- Real-time data updates with TanStack Query
- Responsive design with Tailwind CSS
- Structured logging with Pino
- Type-safe API clients

## Architecture

This application follows modern React best practices:

- Functional components with hooks
- Route-based code splitting
- Centralized state management with Zustand
- Server state management with TanStack Query
- Path aliases for clean imports
- Comprehensive testing setup

## Testing

Run tests:

```bash
pnpm nx test management-ui
```

Run tests with UI:

```bash
pnpm nx test management-ui --ui
```

## Code Quality

ESLint and Prettier are configured for code quality:

```bash
pnpm nx lint management-ui
```

## Future Enhancements

- User authentication with Keycloak integration
- Real-time policy evaluation testing
- Interactive policy editor
- Audit log viewer
- Role assignment interface
