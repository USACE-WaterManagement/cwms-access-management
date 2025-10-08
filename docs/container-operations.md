# Container Operations

This guide covers Docker/Podman operations for building, running, and managing the authorization proxy containers.

## Overview

The cwms-access-management project uses containers for:
- **authorizer-proxy**: Authorization proxy service
- **opa**: Open Policy Agent for policy decisions
- **redis-cache**: Cache for authorization decisions

All services are orchestrated using docker-compose/podman-compose.

## Quick Reference

```bash
# Start all services
podman compose -f docker-compose.podman.yml up -d

# Stop all services
podman compose -f docker-compose.podman.yml down

# View logs
podman logs -f authorizer-proxy

# Restart service
podman compose -f docker-compose.podman.yml restart authorizer-proxy

# Check status
podman ps
```

## Starting Services

### Start All Services

```bash
# Start in detached mode (background)
podman compose -f docker-compose.podman.yml up -d

# Start in foreground (see logs)
podman compose -f docker-compose.podman.yml up

# Start specific service
podman compose -f docker-compose.podman.yml up -d authorizer-proxy

# Start with build (if code changed)
podman compose -f docker-compose.podman.yml up -d --build
```

### Start with Custom Environment

```bash
# Use custom .env file
podman compose -f docker-compose.podman.yml --env-file .env.production up -d

# Override specific variables
BYPASS_AUTH=true podman compose -f docker-compose.podman.yml up -d authorizer-proxy

# Start with debug logging
LOG_LEVEL=debug podman compose -f docker-compose.podman.yml up -d authorizer-proxy
```

## Building Images

### Build All Images

```bash
# Build all services
podman compose -f docker-compose.podman.yml build

# Build with no cache (clean build)
podman compose -f docker-compose.podman.yml build --no-cache

# Build specific service
podman compose -f docker-compose.podman.yml build authorizer-proxy
```

### Build Individual Images

```bash
# Build proxy image directly
podman build -t cwms-authorizer-proxy:local-dev \
  -f apps/services/authorizer-proxy/Dockerfile .

# Build with specific tag
podman build -t cwms-authorizer-proxy:v1.0.0 \
  -f apps/services/authorizer-proxy/Dockerfile .

# Build development image (with hot reload)
podman build -t cwms-authorizer-proxy:dev \
  -f apps/services/authorizer-proxy/Dockerfile.dev .
```

### Build Process

The Dockerfile uses multi-stage builds:

1. **Builder stage**: Installs dependencies and builds the application
   - Runs `pnpm install`
   - Runs `pnpm nx build authorizer-proxy`
   - Creates optimized production bundle

2. **Production stage**: Creates minimal runtime image
   - Copies only built artifacts
   - Uses non-root user
   - Includes health check

**Important**: You don't need to run `pnpm build` manually before building the container. The Dockerfile handles the build process automatically.

## Managing Containers

### View Container Status

```bash
# List running containers
podman ps

# List all containers (including stopped)
podman ps -a

# Filter by service
podman ps --filter "name=authorizer-proxy"

# Show container resource usage
podman stats

# Inspect container details
podman inspect authorizer-proxy
```

### View Logs

```bash
# View all logs
podman logs authorizer-proxy

# Follow logs (real-time)
podman logs -f authorizer-proxy

# Last N lines
podman logs --tail 50 authorizer-proxy

# Logs with timestamps
podman logs -t authorizer-proxy

# Logs since specific time
podman logs --since 10m authorizer-proxy

# Multiple services
podman compose -f docker-compose.podman.yml logs -f
```

### Restart Services

```bash
# Restart single service
podman compose -f docker-compose.podman.yml restart authorizer-proxy

# Restart all services
podman compose -f docker-compose.podman.yml restart

# Restart with recreation (picks up .env changes)
podman compose -f docker-compose.podman.yml down authorizer-proxy
podman compose -f docker-compose.podman.yml up -d authorizer-proxy
```

**Important**: Simply restarting a container won't pick up changes to `.env` file. You must recreate the container (down + up) to apply environment variable changes.

### Stop Services

```bash
# Stop all services
podman compose -f docker-compose.podman.yml down

# Stop and remove volumes
podman compose -f docker-compose.podman.yml down -v

# Stop specific service
podman compose -f docker-compose.podman.yml stop authorizer-proxy

# Stop without removing
podman compose -f docker-compose.podman.yml stop
```

### Execute Commands in Containers

```bash
# Open shell in container
podman exec -it authorizer-proxy sh

# Run specific command
podman exec authorizer-proxy node --version

# Run as root (if needed)
podman exec -u root authorizer-proxy sh

# Check container environment
podman exec authorizer-proxy env
```

## Container Networking

### Network Management

```bash
# Create external network (required)
podman network create cwmsdb_net

# Inspect network
podman network inspect cwmsdb_net

# List networks
podman network ls

# Connect container to network
podman network connect cwmsdb_net authorizer-proxy

# Disconnect container from network
podman network disconnect cwmsdb_net authorizer-proxy
```

### Network Troubleshooting

```bash
# Test connectivity between containers
podman exec authorizer-proxy ping -c 3 opa
podman exec authorizer-proxy ping -c 3 redis

# Check DNS resolution
podman exec authorizer-proxy nslookup opa
podman exec authorizer-proxy nslookup data-api

# View network configuration
podman inspect --format='{{.NetworkSettings.Networks}}' authorizer-proxy
```

## Volume Management

### Redis Data Volume

```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect cwms-access-management_redis_data

# Backup volume
podman run --rm \
  -v cwms-access-management_redis_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz /data

# Restore volume
podman run --rm \
  -v cwms-access-management_redis_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/redis-backup.tar.gz -C /

# Remove volume (WARNING: deletes data)
podman volume rm cwms-access-management_redis_data
```

## OPA Policy Management

### Update OPA Policies

```bash
# Policies are mounted from ./policies directory

# Edit policy file
vi policies/cwms_authz.rego

# Restart OPA to reload policies
podman compose -f docker-compose.podman.yml restart opa

# Or restart using podman directly
podman restart opa

# Verify policy loaded
curl -X POST http://localhost:8181/v1/data/cwms/authz/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {"roles": ["viewer"], "offices": ["HQ"]},
      "resource": "offices",
      "action": "read"
    }
  }'
```

**Note**: OPA automatically reloads policies when files change in the mounted volume.

### Test OPA Policies

```bash
# Test policy directly
curl -X POST http://localhost:8181/v1/data/cwms/authz/allow \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "input": {
    "user": {
      "roles": ["water_manager"],
      "offices": ["SPK"]
    },
    "resource": "timeseries",
    "action": "read"
  }
}
EOF

# Check OPA health
curl http://localhost:8181/health

# View OPA decision logs
podman logs opa | grep "Decision Log"
```

## Updating Configuration

### Update Whitelist

```bash
# Edit whitelist configuration
vi opa-whitelist.json

# Load into .env
./scripts/load-whitelist.sh

# Recreate container (restart won't work)
podman compose -f docker-compose.podman.yml down authorizer-proxy
podman compose -f docker-compose.podman.yml up -d authorizer-proxy

# Verify new configuration
podman logs authorizer-proxy | grep "whitelistedEndpoints"
```

### Update Other Environment Variables

```bash
# Edit .env file
vi .env

# Recreate services
podman compose -f docker-compose.podman.yml down
podman compose -f docker-compose.podman.yml up -d

# Or recreate specific service
podman compose -f docker-compose.podman.yml up -d --force-recreate authorizer-proxy
```

## Health Checks

### Check Container Health

```bash
# View health status in container list
podman ps

# Inspect health check details
podman inspect --format='{{.State.Health}}' authorizer-proxy

# View health check logs
podman inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' authorizer-proxy
```

**Note**: If containers show "unhealthy" status but respond to curl commands, this is a known cosmetic issue with health check configuration. The services are working correctly.

### Service Health Endpoints

```bash
# Proxy health
curl http://localhost:3001/health
curl http://localhost:3001/ready

# OPA health
curl http://localhost:8181/health

# Redis health
podman exec redis-cache redis-cli ping
```

## Cleanup

### Remove Stopped Containers

```bash
# Remove all stopped containers
podman container prune

# Remove containers for this project
podman compose -f docker-compose.podman.yml down
```

### Remove Images

```bash
# Remove unused images
podman image prune

# Remove specific image
podman rmi cwms-authorizer-proxy:local-dev

# Remove all images (WARNING: removes all images)
podman image prune -a
```

### Complete Cleanup

```bash
# Stop and remove containers, networks, volumes
podman compose -f docker-compose.podman.yml down -v

# Remove images
podman rmi cwms-authorizer-proxy:local-dev

# System-wide cleanup
podman system prune -a --volumes

# This removes:
# - All stopped containers
# - All networks not used by containers
# - All images without containers
# - All volumes not used by containers
# - All build cache
```

## Backup and Restore

### Backup Configuration

```bash
# Backup important files
tar czf cwms-auth-backup.tar.gz \
  .env \
  opa-whitelist.json \
  policies/ \
  docker-compose.podman.yml

# Backup with timestamp
tar czf cwms-auth-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  .env opa-whitelist.json policies/ docker-compose.podman.yml
```

### Export/Import Images

```bash
# Export image
podman save cwms-authorizer-proxy:local-dev -o authorizer-proxy.tar

# Import image
podman load -i authorizer-proxy.tar

# Transfer to another machine
scp authorizer-proxy.tar user@host:/tmp/
ssh user@host 'podman load -i /tmp/authorizer-proxy.tar'
```

## Performance Monitoring

### Resource Usage

```bash
# Real-time resource usage
podman stats

# Specific container
podman stats authorizer-proxy

# Format output
podman stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# One-time snapshot
podman stats --no-stream
```

### Redis Monitoring

```bash
# Redis stats
podman exec redis-cache redis-cli INFO stats

# Monitor commands in real-time
podman exec redis-cache redis-cli MONITOR

# Check cache hit rate
podman exec redis-cache redis-cli INFO stats | grep keyspace_hits

# View all keys
podman exec redis-cache redis-cli KEYS "*"
```

## Production Deployment

### Build for Production

```bash
# Set production environment
export NODE_ENV=production
export LOG_LEVEL=info

# Build production image
podman build \
  --build-arg NODE_ENV=production \
  -t cwms-authorizer-proxy:1.0.0 \
  -f apps/services/authorizer-proxy/Dockerfile .

# Tag for registry
podman tag cwms-authorizer-proxy:1.0.0 registry.example.com/cwms-authorizer-proxy:1.0.0

# Push to registry
podman push registry.example.com/cwms-authorizer-proxy:1.0.0
```

### Production Configuration

```bash
# Use production environment file
cp .env.example .env.production

# Edit production values
vi .env.production

# Start with production config
podman compose -f docker-compose.podman.yml --env-file .env.production up -d
```

## Troubleshooting

For common container issues, see [troubleshooting.md](troubleshooting.md).

### Quick Checks

```bash
# Check if containers are running
podman ps

# Check logs for errors
podman logs --tail 100 authorizer-proxy | grep -i error

# Check network connectivity
podman exec authorizer-proxy ping -c 3 data-api

# Check environment variables
podman exec authorizer-proxy env | grep -E "OPA|REDIS|CWMS"

# Restart everything
podman compose -f docker-compose.podman.yml restart
```
