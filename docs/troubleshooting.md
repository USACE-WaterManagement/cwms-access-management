# Troubleshooting Guide

This guide covers common issues and their solutions when working with the CWMS Authorization Proxy.

## Table of Contents

- [Service Health Issues](#service-health-issues)
- [Container Issues](#container-issues)
- [Network Issues](#network-issues)
- [Authentication Issues](#authentication-issues)
- [Build Issues](#build-issues)
- [Configuration Issues](#configuration-issues)
- [Performance Issues](#performance-issues)

## Service Health Issues

### Container Shows "Unhealthy" Status

**Symptom**: `podman ps` shows containers with "(unhealthy)" status

**Diagnosis**: This is often a cosmetic issue with health check configuration. Verify if services are actually working:

```bash
# Test service endpoints
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/cwms-data/offices

# Check logs for actual errors
podman logs authorizer-proxy --tail 100
```

**Solution**:

- If endpoints respond correctly, the services are working fine
- The "unhealthy" status is a known issue with health check timing
- Services are functional despite the status indicator

**Permanent Fix**: Adjust health check configuration in `docker-compose.podman.yml`:

```yaml
healthcheck:
  test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3001/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s # Increase if service takes longer to start
```

### Service Won't Start

**Symptom**: Container immediately exits or won't start

**Diagnosis**:

```bash
# Check container status
podman ps -a

# View logs
podman logs authorizer-proxy

# Check for error codes
podman inspect authorizer-proxy | grep -A 5 State
```

**Common Causes**:

1. **Port conflicts**:

   ```bash
   # Check what's using the port (macOS)
   lsof -i :3001

   # Linux
   ss -tulpn | grep 3001
   ```

   **Solution**: Change port in `.env`:

   ```bash
   PORT=3002
   AUTHORIZER_PROXY_PORT=3002
   ```

2. **Missing dependencies**:

   ```bash
   # Check if dependent services are running
   podman ps | grep -E "opa|redis|data-api"
   ```

   **Solution**: Start dependent services first:

   ```bash
   podman compose -f docker-compose.podman.yml up -d redis opa
   ```

3. **Configuration errors**:

   ```bash
   # Check environment variables
   podman exec authorizer-proxy env
   ```

   **Solution**: Verify `.env` file is correctly formatted

## Container Issues

### Container Exits Immediately

**Symptom**: Container starts but exits within seconds

**Diagnosis**:

```bash
# Check exit code
podman ps -a --filter "name=authorizer-proxy" --format "{{.Status}}"

# View full logs
podman logs authorizer-proxy
```

**Common Causes**:

1. **Application crashes on startup**:

   ```bash
   # Look for JavaScript errors
   podman logs authorizer-proxy | grep -E "Error|Exception"
   ```

   **Solution**: Check application code and configuration

2. **Missing environment variables**:

   ```bash
   # Check required variables
   podman exec authorizer-proxy env | grep -E "CWMS_API_URL|OPA_URL|REDIS_URL"
   ```

   **Solution**: Ensure `.env` file is complete

### Cannot Connect to Container

**Symptom**: `podman exec` fails or container is unreachable

**Diagnosis**:

```bash
# Check if container is running
podman ps | grep authorizer-proxy

# Try to execute a command
podman exec authorizer-proxy echo "test"
```

**Solution**:

```bash
# Restart container
podman restart authorizer-proxy

# If restart fails, recreate
podman compose -f docker-compose.podman.yml down authorizer-proxy
podman compose -f docker-compose.podman.yml up -d authorizer-proxy
```

## Network Issues

### Cannot Connect to Downstream API

**Symptom**: Proxy returns 502 Bad Gateway or connection errors

**Diagnosis**:

```bash
# Check if data-api is running
podman ps | grep data-api

# Test connectivity from proxy container
podman exec authorizer-proxy ping -c 3 data-api
podman exec authorizer-proxy wget -O- http://data-api:7000/cwms-data/offices
```

**Solution**:

1. **Verify network configuration**:

   ```bash
   # Check if containers are on same network
   podman network inspect cwmsdb_net | grep -A 5 authorizer-proxy
   podman network inspect cwmsdb_net | grep -A 5 data-api
   ```

2. **Ensure external network exists**:

   ```bash
   # Create if missing
   podman network create cwmsdb_net

   # Reconnect containers
   podman network connect cwmsdb_net authorizer-proxy
   ```

3. **Check CWMS_API_URL configuration**:

   ```bash
   # Should use container name, not localhost
   # Correct: http://data-api:7000/cwms-data
   # Wrong: http://localhost:7001/cwms-data
   ```

### Cannot Connect to OPA

**Symptom**: Proxy logs show OPA connection errors

**Diagnosis**:

```bash
# Check OPA status
podman ps | grep opa
curl http://localhost:8181/health

# Test from proxy container
podman exec authorizer-proxy wget -O- http://opa:8181/health
```

**Solution**:

```bash
# Restart OPA
podman restart opa

# Check OPA logs
podman logs opa --tail 50

# Verify OPA_URL in environment
podman exec authorizer-proxy env | grep OPA_URL
# Should be: http://opa:8181
```

### Cannot Connect to Redis

**Symptom**: Cache errors in logs

**Diagnosis**:

```bash
# Check Redis status
podman ps | grep redis
podman exec redis-cache redis-cli ping

# Test from proxy container
podman exec authorizer-proxy sh -c "echo PING | nc redis 6379"
```

**Solution**:

```bash
# Restart Redis
podman restart redis-cache

# Check Redis logs
podman logs redis-cache --tail 50

# Verify Redis connection string
podman exec authorizer-proxy env | grep REDIS_URL
# Should be: redis://redis:6379
```

## Authentication Issues

### JWT Token Retrieval Fails

**Symptom**: Cannot get JWT token from Keycloak

**Diagnosis**:

```bash
# Test Keycloak availability
curl http://localhost:8080/auth/realms/cwms

# Try to get token
curl -v -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=m5hectest" \
  -d "password=m5hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms"
```

**Common Causes**:

1. **Realm not enabled**:

   ```bash
   # Check realm status
   podman exec auth /opt/keycloak/bin/kcadm.sh config credentials \
     --server http://localhost:8080/auth --realm master --user admin --password admin

   podman exec auth /opt/keycloak/bin/kcadm.sh get realms/cwms | jq '.enabled'
   ```

   **Solution**: Enable realm:

   ```bash
   podman exec auth /opt/keycloak/bin/kcadm.sh update realms/cwms -s enabled=true
   ```

2. **Direct Access Grants not enabled**:

   ```bash
   # Check client configuration
   podman exec auth /opt/keycloak/bin/kcadm.sh get clients -r cwms \
     | jq '.[] | select(.clientId == "cwms") | .directAccessGrantsEnabled'
   ```

   **Solution**: See [setup.md](setup.md#3-configure-keycloak)

3. **User doesn't exist**:

   ```bash
   # List users
   podman exec auth /opt/keycloak/bin/kcadm.sh get users -r cwms \
     | jq -r '.[].username'
   ```

### Authorization Always Denied

**Symptom**: All requests return 403 Forbidden

**Diagnosis**:

```bash
# Check OPA policy
curl -X POST http://localhost:8181/v1/data/cwms/authz/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {"roles": ["viewer"], "offices": ["HQ"]},
      "resource": "offices",
      "action": "read"
    }
  }'

# Check proxy logs
podman logs authorizer-proxy | grep -i "authorization"
```

**Solution**:

1. **Check whitelist configuration**:

   ```bash
   # View configured whitelist
   podman logs authorizer-proxy | grep "whitelistedEndpoints"
   ```

2. **Test with BYPASS_AUTH**:

   ```bash
   # Temporarily bypass authorization
   BYPASS_AUTH=true podman compose -f docker-compose.podman.yml up -d --force-recreate authorizer-proxy
   ```

3. **Verify OPA policy**:

   ```bash
   # Check policy file
   cat policies/cwms_authz.rego
   ```

## Build Issues

### Build Fails with Dependencies Error

**Symptom**: `pnpm install` or build fails

**Diagnosis**:

```bash
# Check Node.js version
node --version  # Should be 24.x

# Check pnpm version
pnpm --version  # Should be 10.15.1

# Try clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Solution**:

1. **Use mise to install correct versions**:

   ```bash
   mise install
   mise exec -- pnpm install
   ```

2. **Clear pnpm cache**:

   ```bash
   pnpm store prune
   pnpm install --force
   ```

### Container Build Fails

**Symptom**: `podman build` or `podman compose build` fails

**Diagnosis**:

```bash
# Check build logs
podman compose -f docker-compose.podman.yml build authorizer-proxy 2>&1 | tee build.log

# Look for specific errors
grep -i error build.log
```

**Common Causes**:

1. **Network issues during build**:

   ```bash
   # Retry with verbose output
   podman build --no-cache -t cwms-authorizer-proxy:local-dev \
     -f apps/services/authorizer-proxy/Dockerfile .
   ```

2. **Disk space issues**:

   ```bash
   # Check disk space
   df -h

   # Clean up old images
   podman system prune -a
   ```

3. **Build cache corruption**:

   ```bash
   # Build without cache
   podman compose -f docker-compose.podman.yml build --no-cache
   ```

## Configuration Issues

### Environment Variables Not Applied

**Symptom**: Changes to `.env` file don't take effect

**Diagnosis**:

```bash
# Check running container's environment
podman exec authorizer-proxy env | sort
```

**Solution**:

**Important**: Restarting a container doesn't pick up `.env` changes. You must recreate:

```bash
# Wrong (doesn't pick up .env changes)
podman restart authorizer-proxy

# Correct (picks up .env changes)
podman compose -f docker-compose.podman.yml down authorizer-proxy
podman compose -f docker-compose.podman.yml up -d authorizer-proxy

# Or force recreate
podman compose -f docker-compose.podman.yml up -d --force-recreate authorizer-proxy
```

### Whitelist Configuration Not Working

**Symptom**: Wrong endpoints are being authorized by OPA

**Diagnosis**:

```bash
# Check whitelist configuration on startup
podman logs authorizer-proxy | grep "whitelistedEndpoints"

# Check .env file
cat .env | grep OPA_WHITELIST_ENDPOINTS
```

**Solution**:

1. **Update whitelist**:

   ```bash
   # Edit whitelist file
   vi opa-whitelist.json

   # Load into .env
   ./scripts/load-whitelist.sh

   # Recreate container (important!)
   podman compose -f docker-compose.podman.yml down authorizer-proxy
   podman compose -f docker-compose.podman.yml up -d authorizer-proxy

   # Verify
   podman logs authorizer-proxy | grep "count"
   ```

2. **Check JSON format**:

   ```bash
   # Validate JSON
   jq . opa-whitelist.json
   ```

## Performance Issues

### Slow Response Times

**Symptom**: Requests take longer than expected

**Diagnosis**:

```bash
# Test response time
time curl http://localhost:3001/cwms-data/offices

# Check proxy logs for timing
podman logs authorizer-proxy | grep "responseTime"

# Check container resource usage
podman stats authorizer-proxy
```

**Solution**:

1. **Check Redis cache hit rate**:

   ```bash
   podman exec redis-cache redis-cli INFO stats | grep keyspace_hits
   ```

2. **Increase cache TTL**:

   ```bash
   # In .env
   CACHE_TTL_SECONDS=600  # Increase from 300
   ```

3. **Check OPA performance**:

   ```bash
   podman logs opa | grep "timer_rego_query_eval"
   ```

### High Memory Usage

**Symptom**: Container uses excessive memory

**Diagnosis**:

```bash
# Check memory usage
podman stats --no-stream authorizer-proxy

# Check Node.js heap usage
podman exec authorizer-proxy node -e "console.log(process.memoryUsage())"
```

**Solution**:

1. **Limit Redis memory**:

   ```bash
   # Already configured in docker-compose.podman.yml
   # maxmemory 256mb
   # maxmemory-policy allkeys-lru
   ```

2. **Reduce cache size**:

   ```bash
   # In .env
   CACHE_MAX_SIZE=500  # Reduce from 1000
   ```

3. **Set Node.js memory limit**:

   ```bash
   # Add to docker-compose.podman.yml
   environment:
     NODE_OPTIONS: "--max-old-space-size=512"
   ```

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# Version information
podman --version
node --version
pnpm --version

# Container status
podman ps -a

# Service logs
podman logs authorizer-proxy --tail 100
podman logs opa --tail 50
podman logs redis-cache --tail 20

# Configuration
cat .env | grep -v "PASSWORD\|SECRET"

# Network info
podman network inspect cwmsdb_net

# Health checks
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:8181/health
podman exec redis-cache redis-cli ping
```

### Log Files

Collect logs for troubleshooting:

```bash
# Save all logs
podman logs authorizer-proxy > authorizer-proxy.log 2>&1
podman logs opa > opa.log 2>&1
podman logs redis-cache > redis.log 2>&1

# Create diagnostic bundle
tar czf diagnostic-$(date +%Y%m%d-%H%M%S).tar.gz \
  *.log .env opa-whitelist.json
```

### Additional Resources

- [Setup Guide](setup.md)
- [Development Guide](development.md)
- [Container Operations](container-operations.md)
- [OPA Whitelist Guide](../apps/services/authorizer-proxy/docs/opa-whitelist-guide.md)
- [Configuration Guide](../apps/services/authorizer-proxy/docs/configuration.md)

## Still Need Help?

If you can't resolve your issue:

1. Check project issues on GitHub
2. Review recent changes in git log
3. Compare your setup with working examples
4. Reach out to the team with diagnostic information
