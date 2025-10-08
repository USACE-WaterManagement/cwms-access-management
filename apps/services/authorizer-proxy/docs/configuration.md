# Configuration

## Files

- `.env` - Local configuration (git-ignored)
- `.env.example` - Template (committed)
- `opa-whitelist.json` - Endpoints requiring OPA auth (committed)
- `opa-whitelist.example.json` - Example whitelist (committed)

## Setup

```bash
cp .env.example .env
./scripts/load-whitelist.sh
```

## Whitelist Management

```bash
# Edit whitelist
vi opa-whitelist.json

# Load into .env
./scripts/load-whitelist.sh

# Restart service
podman compose -f docker-compose.podman.yml restart authorizer-proxy
```

## Environment Variables

| Variable                  | Default                                          | Description                  |
| ------------------------- | ------------------------------------------------ | ---------------------------- |
| `NODE_ENV`                | `development`                                    | Environment mode             |
| `PORT`                    | `3001`                                           | Internal port                |
| `HOST`                    | `0.0.0.0`                                        | Bind address                 |
| `LOG_LEVEL`               | `info`                                           | Log level                    |
| `CWMS_API_URL`            | `http://data-api:7000/cwms-data`                 | CWMS Data API                |
| `OPA_URL`                 | `http://opa:8181`                                | OPA service                  |
| `REDIS_URL`               | `redis://redis:6379`                             | Redis cache                  |
| `OPA_POLICY_PATH`         | `/v1/data/cwms/authz/allow`                      | OPA policy endpoint          |
| `OPA_WHITELIST_ENDPOINTS` | `["/cwms-data/timeseries","/cwms-data/offices"]` | Endpoints requiring OPA auth |
| `BYPASS_AUTH`             | `false`                                          | Skip auth (dev only)         |
| `CACHE_TTL_SECONDS`       | `300`                                            | Cache TTL                    |
| `CACHE_MAX_SIZE`          | `1000`                                           | Max cached decisions         |
| `AUTHORIZER_PROXY_PORT`   | `3001`                                           | External port                |
| `REDIS_PORT`              | `6379`                                           | Redis external port          |
| `OPA_PORT`                | `8181`                                           | OPA external port            |
| `NETWORK_NAME`            | `cwmsdb_net`                                     | Docker network               |

## Troubleshooting

```bash
# Script permissions
chmod +x ./scripts/load-whitelist.sh

# Validate JSON
jq . opa-whitelist.json

# Check loaded config
podman exec authorizer-proxy env | grep OPA_WHITELIST

# Verify whitelist
podman logs authorizer-proxy | grep "whitelist"
```
