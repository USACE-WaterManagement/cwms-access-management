# CWMS Access Management

Authorization proxy and access control system for CWMS Data API.

## Overview

The CWMS Access Management system provides transparent authorization for CWMS Data API using Open Policy Agent (OPA) with a whitelist-based approach. It intercepts API requests, evaluates authorization policies, and adds a single authorization context header before forwarding to the downstream API.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
./scripts/load-whitelist.sh

# 3. Start services
podman compose -f docker-compose.podman.yml up -d

# 4. Verify it's working
curl http://localhost:3001/health
curl http://localhost:3001/cwms-data/offices
```

**First time?** See the complete [setup guide](docs/setup.md) for detailed instructions.

## Architecture

```
Client → Authorization Proxy (3001) → OPA (8181) → Policy Decision
                ↓
         CWMS Data API (7001)
```

### Key Components

| Component | Port | Description |
|-----------|------|-------------|
| **Authorization Proxy** | 3001 | Transparent proxy that intercepts and authorizes requests |
| **OPA** | 8181 | Policy engine for authorization decisions |
| **Redis** | 6379 | Caches authorization decisions for performance |
| **CWMS Data API** | 7001 | Downstream API being protected |

### Authorization Flow

1. Client sends request to authorization proxy
2. Proxy determines if endpoint requires OPA authorization (whitelist check)
3. For whitelisted endpoints: queries OPA for authorization decision
4. If allowed: adds `x-cwms-auth-context` header with complete authorization context
5. Request forwarded to CWMS Data API
6. API response returned to client unchanged

### Whitelist Pattern

Only endpoints in the OPA whitelist require authorization. Others are transparently proxied without OPA evaluation.

Configure whitelist in `opa-whitelist.json`:
```json
[
  "/cwms-data/timeseries",
  "/cwms-data/offices",
  "/cwms-data/locations"
]
```

Load configuration: `./scripts/load-whitelist.sh`

## Authorization Context Header

All authorization data is passed in a single `x-cwms-auth-context` header:

```json
{
  "policy": {
    "allow": true,
    "decision_id": "proxy-1234567890-abc"
  },
  "user": {
    "id": "user123",
    "username": "jdoe",
    "email": "jdoe@example.com",
    "roles": ["water_manager"],
    "offices": ["SPK", "SWT"],
    "primary_office": "SPK"
  },
  "constraints": {},
  "context": {},
  "timestamp": "2025-09-29T08:00:00.000Z"
}
```

The CWMS Data API receives this header and can use it for database context or logging. The Java API does not perform authorization - only the authorization proxy makes authorization decisions via OPA.

## Documentation

### Getting Started

- [Setup Guide](docs/setup.md) - First-time setup and prerequisites
- [Development Guide](docs/development.md) - Local development workflow
- [Container Operations](docs/container-operations.md) - Docker/Podman commands
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Performance Optimization](docs/performance.md) - Performance tuning and monitoring

### Service Documentation

- [Configuration Guide](apps/services/authorizer-proxy/docs/configuration.md) - Environment variables and settings
- [OPA Whitelist Guide](apps/services/authorizer-proxy/docs/opa-whitelist-guide.md) - Whitelist pattern and endpoint configuration
- [Authentication Integration](apps/services/authorizer-proxy/docs/authentication.md) - JWT and Keycloak integration

## Project Structure

```
cwms-access-management/
├── apps/
│   └── services/
│       └── authorizer-proxy/       # Transparent authorization proxy
│           ├── src/                # Source code
│           ├── docs/               # Service-specific documentation
│           ├── Dockerfile          # Production image
│           └── Dockerfile.dev      # Development image
├── policies/
│   └── cwms_authz.rego            # OPA authorization policies
├── scripts/
│   └── load-whitelist.sh          # Load whitelist configuration
├── docs/                           # Project documentation
│   ├── setup.md                   # Setup guide
│   ├── development.md             # Development guide
│   ├── container-operations.md    # Container operations
│   └── troubleshooting.md         # Troubleshooting guide
├── tools/
│   └── postman/                   # Postman test collections
├── .env.example                    # Environment template
├── opa-whitelist.json             # Whitelist configuration
└── docker-compose.podman.yml      # Container orchestration
```

## Common Commands

### Development

```bash
# Run locally with hot reload
pnpm dev

# Run tests
pnpm nx test authorizer-proxy

# Lint and format
pnpm nx lint authorizer-proxy
pnpm nx format

# Build
pnpm nx build authorizer-proxy
```

### Container Operations

```bash
# Start services
podman compose -f docker-compose.podman.yml up -d

# View logs
podman logs -f authorizer-proxy

# Restart after configuration changes
podman compose -f docker-compose.podman.yml down authorizer-proxy
podman compose -f docker-compose.podman.yml up -d authorizer-proxy

# Stop all services
podman compose -f docker-compose.podman.yml down
```

### Testing

```bash
# Health check
curl http://localhost:3001/health

# Test endpoint (public)
curl http://localhost:3001/cwms-data/offices

# Test with custom user context
curl http://localhost:3001/cwms-data/offices \
  -H 'x-test-user: {"id":"test","username":"testuser","roles":["water_manager"],"offices":["SPK"]}'

# Get JWT token from Keycloak
curl -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=m5hectest" \
  -d "password=m5hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms" \
  | jq -r '.access_token'
```

## Testing Resources

- **Postman Collection**: [tools/postman/cwms-authorization.postman_collection.json](tools/postman/cwms-authorization.postman_collection.json)
  - Health checks
  - JWT token retrieval
  - Whitelisted vs non-whitelisted endpoints
  - Direct OPA policy testing

## Environment Variables

Key configuration in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Proxy server port | `3001` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `CWMS_API_URL` | Downstream API URL | `http://data-api:7000/cwms-data` |
| `OPA_URL` | OPA service URL | `http://opa:8181` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `BYPASS_AUTH` | Skip authorization (dev only) | `false` |
| `OPA_WHITELIST_ENDPOINTS` | Endpoints requiring OPA | JSON array |

See [configuration.md](apps/services/authorizer-proxy/docs/configuration.md) for complete documentation.

## Prerequisites

- **Node.js 24+**
- **pnpm 10.15.1+**
- **Podman or Docker**
- **Running CWMS infrastructure:**
  - CWMS Data API (port 7001)
  - Keycloak (port 8080)
  - Oracle Database (port 1521)
  - Traefik (port 8081)

**Recommended**: Use [mise](https://mise.jdx.dev/) to manage tool versions:
```bash
mise install  # Installs Node 24 and pnpm 10.15.1
```

## Next Steps

1. Complete [first-time setup](docs/setup.md)
2. Review the [development guide](docs/development.md)
3. Read about [OPA whitelist configuration](apps/services/authorizer-proxy/docs/opa-whitelist-guide.md)
4. Learn about [performance optimization](docs/performance.md)

## Support

For issues and troubleshooting:
1. Check the [troubleshooting guide](docs/troubleshooting.md)
2. Review container logs: `podman logs authorizer-proxy`
3. Verify configuration: `cat .env | grep OPA_WHITELIST`
4. Test services individually: See [troubleshooting guide](docs/troubleshooting.md)

## License

See LICENSE file for details.
