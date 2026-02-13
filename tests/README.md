# CWMS Access Management Tests

This directory contains tests for the CWMS authorization system.

## Directory Structure

```
tests/
├── integration/              # Integration tests (require running services)
│   ├── setup/               # Test configuration
│   │   └── config.ts        # URLs, test users, timeouts
│   ├── helpers/             # Test utilities
│   │   ├── auth.ts          # JWT token retrieval from Keycloak
│   │   └── http.ts          # HTTP request helpers
│   └── suites/              # Test suites organized by feature
│       ├── public-endpoints.test.ts
│       ├── dam-operator.test.ts
│       ├── water-manager.test.ts
│       ├── viewer-users.test.ts
│       └── diagnostics.test.ts
├── unit/                    # Unit tests (no external dependencies)
└── README.md               # This file
```

## Integration Tests

Integration tests validate the complete authorization flow:
- JWT token retrieval from Keycloak
- Request routing through the authorization proxy
- OPA policy evaluation
- Response handling

### Prerequisites

All services must be running:

```bash
# Start all services
podman compose -f docker-compose.podman.yml up -d

# Verify services are healthy
podman ps
```

Required services:
- Keycloak (port 8080) - Authentication
- Authorization Proxy (port 3001) - Request interception
- CWMS Data API (port 7001) - Backend API
- OPA (port 8181) - Policy evaluation
- Oracle Database (port 1521) - Data storage

### Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run a specific test suite
pnpm test:integration:public
pnpm test:integration:dam-operator
pnpm test:integration:water-manager
pnpm test:integration:viewer-users
pnpm test:integration:diagnostics

# Run tests with verbose output
pnpm vitest run tests/integration --reporter=verbose

# Run specific test file directly
pnpm vitest run tests/integration/suites/dam-operator.test.ts
```

### Test Users

| User | Username | Office | Persona | Expected Behavior |
|------|----------|--------|---------|-------------------|
| Dam Operator | m5hectest | SWT, HQ | dam_operator | Read timeseries with embargo |
| Water Manager | l2hectest | SPK, HQ | water_manager | Read/write, embargo exempt |
| Viewer User | l1hectest | HQ, SPL | Viewer Users | Read-only, public data |

### Test Cases

#### Public Endpoints
- Unauthenticated access to /offices, /units, /parameters, /timezones
- Proxy vs direct API response comparison

#### Dam Operator (m5hectest)
- Authentication via Keycloak
- Office-based access (SWT allowed, SPK denied)
- Read access to timeseries, locations, levels
- Embargo restrictions apply

#### Water Manager (l2hectest)
- Authentication via Keycloak
- Office-based access (SPK allowed)
- Read access to timeseries, locations, forecasts, ratings
- Embargo exempt

#### Viewer Users (l1hectest)
- Authentication via Keycloak
- Limited to public resources
- Read-only (no POST/PUT/DELETE)
- Maximum embargo restrictions

## Unit Tests

Unit tests are located in `tests/unit/` and test individual components in isolation.

```bash
# Run all tests (unit and integration)
pnpm test

# Run in watch mode
pnpm test:watch
```

## Adding New Tests

1. Create test file in appropriate directory:
   - Integration: `tests/integration/suites/<feature>.test.ts`
   - Unit: `tests/unit/<module>/<feature>.test.ts`

2. Follow the vitest pattern:
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from 'vitest';

   describe('Feature Name', () => {
     beforeAll(async () => {
       // Setup code
     });

     afterAll(() => {
       // Cleanup code
     });

     it('should do something', async () => {
       const result = await someFunction();
       expect(result).toBe(expected);
       expect(result).toBeTruthy();
       expect(array).toContain(value);
     });
   });
   ```

3. Test files are auto-discovered by vitest (no runner needed)

## Known Limitations

### User Configuration Mismatch

The test users have different configurations in Keycloak vs the CWMS database:

| User | Keycloak Username | Database Username | Issue |
|------|------------------|-------------------|-------|
| Water Manager | l2hectest.1234567890 | l2hectest | EDIPI suffix in Keycloak |
| Viewer User | l1hectest | l1hectest | No CWMS Users role in DB |

**Impact:**
- Water Manager tests fail because the API can't find the user profile
- Viewer User tests pass (by design) but user falls back to anonymous access

**Resolution:**
To fix user matching, update the database to use principal mapping:
```sql
-- Map Keycloak principal to database user
UPDATE at_sec_cwms_users SET principle_name = 'http://localhost:8080/auth/realms/cwms::<keycloak-sub-uuid>'
WHERE userid = 'l2hectest';
```

### OPA Policy Hot-Reload

OPA loads policies from the mounted volume but doesn't automatically reload:
- After adding new policy files, restart OPA: `podman restart opa`
- Verify loaded policies: `curl http://localhost:8181/v1/policies | jq -r '.result[].id'`

## Troubleshooting

### Services not healthy
```bash
# Check service status
podman ps

# View service logs
podman logs authorizer-proxy
podman logs auth
podman logs data-api
```

### Token retrieval fails
- Verify Keycloak is running: `curl http://localhost:8080/auth/health/ready`
- Check user exists in Keycloak realm
- Verify password is correct

### Tests timeout
- Increase timeout in `tests/integration/setup/config.ts`
- Check network connectivity between services

### Authorization denied unexpectedly
1. Check OPA policies are loaded: `curl http://localhost:8181/v1/policies | jq -r '.result[].id'`
2. Check user profile from API: `curl -H "Authorization: Bearer <token>" http://localhost:7001/cwms-data/user/profile`
3. Check proxy logs: `podman logs authorizer-proxy --tail 50`
4. Clear Redis cache if stale: `podman exec redis-cache redis-cli FLUSHALL`
