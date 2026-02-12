import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const authLatency = new Trend('auth_latency', true);
const healthLatency = new Trend('health_latency', true);
const authorizeLatency = new Trend('authorize_latency', true);
const successRate = new Rate('success_rate');
const requestCount = new Counter('request_count');

const PROXY_URL = __ENV.PROXY_URL || 'http://localhost:3001';
const KEYCLOAK_URL = __ENV.KEYCLOAK_URL || 'http://localhost:8080';

let cachedToken = null;

function getToken() {
  if (cachedToken) return cachedToken;

  const response = http.post(`${KEYCLOAK_URL}/auth/realms/cwms/protocol/openid-connect/token`, {
    username: 'm5hectest',
    password: 'm5hectest',
    grant_type: 'password',
    client_id: 'cwms',
  }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.status === 200) {
    cachedToken = JSON.parse(response.body).access_token;
    return cachedToken;
  }
  return null;
}

export const options = {
  scenarios: {
    quick_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    success_rate: ['rate>0.95'],
  },
};

export function setup() {
  // Verify connectivity
  const health = http.get(`${PROXY_URL}/health`);
  if (health.status !== 200) {
    throw new Error(`Proxy not accessible: ${health.status}`);
  }

  // Get token
  const token = getToken();
  if (!token) {
    console.warn('Could not get auth token - authenticated tests will fail');
  }

  return { token };
}

export default function(data) {
  const requestType = Math.random();
  requestCount.add(1);

  if (requestType < 0.2) {
    // Health check
    const start = Date.now();
    const res = http.get(`${PROXY_URL}/health`);
    healthLatency.add(Date.now() - start);
    successRate.add(res.status === 200);
    check(res, { 'health ok': (r) => r.status === 200 });

  } else if (requestType < 0.6 && data.token) {
    // Authenticated timeseries request
    const start = Date.now();
    const res = http.get(`${PROXY_URL}/cwms-data/timeseries?office=SWT`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    authLatency.add(Date.now() - start);
    successRate.add(res.status === 200 || res.status === 404);
    check(res, { 'auth request ok': (r) => r.status === 200 || r.status === 404 });

  } else if (data.token) {
    // Authorize endpoint
    const start = Date.now();
    const res = http.post(`${PROXY_URL}/authorize`, JSON.stringify({
      resource: 'timeseries',
      action: 'read',
      jwt_token: data.token,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    authorizeLatency.add(Date.now() - start);
    successRate.add(res.status === 200);
    check(res, { 'authorize ok': (r) => r.status === 200 });

  } else {
    // Fallback to health
    const res = http.get(`${PROXY_URL}/health`);
    successRate.add(res.status === 200);
  }

  sleep(0.05);
}

export function teardown() {
  // Fetch final metrics
  const metrics = http.get(`${PROXY_URL}/metrics`);
  if (metrics.status === 200) {
    console.log('\n=== Prometheus Metrics Summary ===');
    const lines = metrics.body.split('\n').filter(line =>
      line.startsWith('authorizer_proxy_') &&
      !line.startsWith('#') &&
      (line.includes('_total') || line.includes('_bucket'))
    );
    lines.slice(0, 30).forEach(line => console.log(line));
  }
}
