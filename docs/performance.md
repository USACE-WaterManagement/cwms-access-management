# Performance Optimization

This guide covers performance optimization techniques for the CWMS Authorization Proxy, including caching, profiling,
and monitoring.

## Overview

The authorization proxy is designed for high performance with minimal latency. Key performance features:

- Redis caching for authorization decisions
- Connection pooling for OPA and downstream API
- Asynchronous request handling
- Efficient policy evaluation

## Redis Caching (Planned)

Redis caching for authorization decisions is configured in the infrastructure but not yet implemented in the application
code.

### Current Status

- Redis container is running and healthy
- Environment variables are configured (`REDIS_URL`, `CACHE_TTL_SECONDS`, `CACHE_MAX_SIZE`)
- Application does not yet use Redis for caching
- Each request currently evaluates OPA policy

### Planned Implementation

When Redis caching is implemented, it will:

- Cache authorization decisions to reduce repeated OPA evaluations
- Use configurable TTL for cache entries
- Implement cache key strategies based on user context and resource
- Monitor cache hit/miss rates

### Verify Redis is Running

```bash
# Check Redis container status
podman ps | grep redis-cache

# Test Redis connectivity
podman exec redis-cache redis-cli ping
# Should output: PONG

# Check Redis version
podman exec redis-cache redis-cli INFO server | grep redis_version
```

## Application Profiling

### Node.js Built-in Profiler

```bash
# Run with profiling enabled
node --prof ./dist/apps/services/authorizer-proxy/server.js

# Generate profiling report
node --prof-process isolate-*.log > profile.txt

# View report
less profile.txt
```

### CPU Profiling

```bash
# Run with inspector
node --inspect ./dist/apps/services/authorizer-proxy/server.js

# Connect with Chrome DevTools
# Open: chrome://inspect
# Click "inspect" on the target
```

### Memory Profiling

```bash
# Take heap snapshot programmatically
node --inspect-brk ./dist/apps/services/authorizer-proxy/server.js

# Use Chrome DevTools Memory tab
# Take snapshots and compare
```

## Performance Monitoring

### Response Time Analysis

```bash
# View response times in logs
podman logs authorizer-proxy | grep "responseTime"

# Extract average response time
podman logs authorizer-proxy | grep "responseTime" | \
  awk '{print $NF}' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

### Request Rate Monitoring

```bash
# Count requests per minute
podman logs authorizer-proxy --since 1m | grep "incoming request" | wc -l

# Monitor in real-time
watch -n 1 'podman logs authorizer-proxy --since 1m | grep "incoming request" | wc -l'
```

### OPA Policy Performance

```bash
# View OPA decision timing
podman logs opa | grep "timer_rego_query_eval"

# Extract policy evaluation times
podman logs opa | grep "timer_rego_query_eval" | \
  jq -r '.metrics.timer_rego_query_eval_ns / 1000000' | \
  awk '{sum+=$1; count++} END {print "Average OPA eval:", sum/count, "ms"}'
```

## Resource Usage

### Container Resource Monitoring

```bash
# Real-time resource usage
podman stats authorizer-proxy

# Single snapshot
podman stats --no-stream authorizer-proxy

# Format specific metrics
podman stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" authorizer-proxy
```

### Memory Usage

```bash
# Check Node.js memory usage
podman exec authorizer-proxy node -e "console.log(process.memoryUsage())"

# Monitor heap size
watch -n 1 'podman exec authorizer-proxy node -e "console.log(JSON.stringify(process.memoryUsage(), null, 2))"'
```

### Set Resource Limits

In `docker-compose.podman.yml`:

```yaml
services:
  authorizer-proxy:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Optimization Techniques

### Connection Pooling

The proxy maintains connection pools for:

- OPA HTTP client
- CWMS Data API HTTP client
- Redis connection

Monitor connection pool usage:

```bash
# View active connections
podman logs authorizer-proxy | grep "connection"
```

### Request Batching

For high-volume scenarios, consider batching authorization decisions:

```typescript
// Example: Batch multiple resource checks
const decisions = await Promise.all([
  checkAuthorization(user, 'resource1'),
  checkAuthorization(user, 'resource2'),
  checkAuthorization(user, 'resource3'),
]);
```

### Async Processing

All I/O operations are asynchronous:

- OPA policy evaluation
- Redis cache lookups
- Downstream API requests

No blocking operations in request handling path.

## Load Testing

### Using Apache Bench

```bash
# Test proxy endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test with authorization header
ab -n 1000 -c 10 \
  -H 'x-test-user: {"id":"test","username":"test","roles":["viewer"]}' \
  http://localhost:3001/cwms-data/offices
```

### Using wrk

```bash
# Install wrk
brew install wrk  # macOS

# Run load test
wrk -t 10 -c 100 -d 30s http://localhost:3001/health

# With custom header
wrk -t 10 -c 100 -d 30s \
  -H 'x-test-user: {"id":"test","username":"test","roles":["viewer"]}' \
  http://localhost:3001/cwms-data/offices
```

## Performance Benchmarks

Expected performance characteristics:

- **Health check**: < 5ms
- **Cache hit**: < 10ms additional latency
- **Cache miss + OPA**: < 50ms additional latency
- **Full request (cache hit)**: API latency + 10-15ms
- **Full request (cache miss)**: API latency + 50-70ms

### Measure Latency

```bash
# Test with curl timing
curl -o /dev/null -s -w "Time: %{time_total}s\n" http://localhost:3001/health

# Test authorization latency
time curl -s http://localhost:3001/cwms-data/offices \
  -H 'x-test-user: {"id":"test","username":"test","roles":["viewer"]}' \
  > /dev/null
```

## Troubleshooting Performance Issues

### Slow Responses

1. Check OPA response times:

   ```bash
   podman logs opa | grep "timer_rego_query_eval"
   ```

2. Check Redis connectivity:

   ```bash
   podman exec authorizer-proxy time redis-cli -h redis ping
   ```

3. Check downstream API:

   ```bash
   time curl -s http://localhost:7001/cwms-data/offices > /dev/null
   ```

### High Memory Usage

1. Check for memory leaks:

   ```bash
   podman stats authorizer-proxy
   ```

2. Reduce cache size:

   ```bash
   CACHE_MAX_SIZE=500
   ```

3. Set Node.js heap limit:

   ```yaml
   environment:
     NODE_OPTIONS: '--max-old-space-size=512'
   ```

### High CPU Usage

1. Check request volume:

   ```bash
   podman logs authorizer-proxy | grep "incoming request" | wc -l
   ```

2. Profile CPU usage:

   ```bash
   node --prof server.js
   ```

3. Optimize OPA policies (reduce complexity)

## Production Recommendations

1. **Implement Redis caching** to reduce OPA evaluation overhead

2. **Enable Redis persistence** when caching is implemented:

   ```yaml
   command: redis-server --appendonly yes
   ```

3. **Use connection pooling** for all HTTP clients

4. **Set resource limits** to prevent resource exhaustion

5. **Enable request logging** for performance analysis

6. **Use CDN or load balancer** for horizontal scaling

## Additional Resources

- [Node.js Performance Guide](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Redis Best Practices](https://redis.io/docs/manual/optimization/)
- [OPA Performance](https://www.openpolicyagent.org/docs/latest/policy-performance/)
