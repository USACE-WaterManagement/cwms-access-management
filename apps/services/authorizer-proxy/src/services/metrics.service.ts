import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

collectDefaultMetrics({ register, prefix: 'authorizer_proxy_' });

export const httpRequestDuration = new Histogram({
  name: 'authorizer_proxy_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'authorizer_proxy_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const opaEvaluationDuration = new Histogram({
  name: 'authorizer_proxy_opa_evaluation_duration_seconds',
  help: 'Duration of OPA policy evaluation in seconds',
  labelNames: ['resource', 'action', 'decision'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const opaEvaluationsTotal = new Counter({
  name: 'authorizer_proxy_opa_evaluations_total',
  help: 'Total number of OPA policy evaluations',
  labelNames: ['resource', 'action', 'decision'],
  registers: [register],
});

export const cacheOperationDuration = new Histogram({
  name: 'authorizer_proxy_cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'result'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
  registers: [register],
});

export const cacheHitsTotal = new Counter({
  name: 'authorizer_proxy_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissesTotal = new Counter({
  name: 'authorizer_proxy_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const apiCallDuration = new Histogram({
  name: 'authorizer_proxy_api_call_duration_seconds',
  help: 'Duration of downstream API calls in seconds',
  labelNames: ['endpoint', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const apiCallsTotal = new Counter({
  name: 'authorizer_proxy_api_calls_total',
  help: 'Total number of downstream API calls',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});

export const authorizationDecisionsTotal = new Counter({
  name: 'authorizer_proxy_authorization_decisions_total',
  help: 'Total number of authorization decisions',
  labelNames: ['decision', 'resource'],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'authorizer_proxy_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const opaCacheHitsTotal = new Counter({
  name: 'authorizer_proxy_opa_cache_hits_total',
  help: 'Total number of OPA decision cache hits',
  registers: [register],
});

export const opaCacheMissesTotal = new Counter({
  name: 'authorizer_proxy_opa_cache_misses_total',
  help: 'Total number of OPA decision cache misses',
  registers: [register],
});

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export async function getMetricsJson(): Promise<Record<string, unknown>> {
  const metrics = await register.getMetricsAsJSON();
  return {
    timestamp: new Date().toISOString(),
    metrics,
  };
}

export function resetMetrics(): void {
  register.resetMetrics();
}

export { register };
