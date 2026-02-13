import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ['verbose'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'apps/services/authorizer-proxy/src/**/*.ts',
        'apps/cli/management-cli/src/**/*.ts',
        'apps/web/management-ui/src/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/types/**',
        '**/*.d.ts',
        '**/index.ts',
        '**/server.ts',
        '**/plugins/**',
        '**/main.tsx',
        '**/vite-env.d.ts',
      ],
    },
  },
});
