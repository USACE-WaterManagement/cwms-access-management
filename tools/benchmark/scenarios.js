import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const authorizationLatency = new Trend('authorization_latency', true);
const opaEvaluationSuccess = new Rate('opa_evaluation_success');
const cacheHitRate = new Rate('cache_hit_rate');

// Configuration from environment variables
const PROXY_URL = __ENV.PROXY_URL || 'http://localhost:3001';
const KEYCLOAK_URL = __ENV.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = __ENV.KEYCLOAK_REALM || 'cwms';
const KEYCLOAK_CLIENT_ID = __ENV.KEYCLOAK_CLIENT_ID || 'cwms';

// Test users
const TEST_USERS = {
  damOperator: { username: 'm5hectest', password: 'm5hectest' },
  waterManager: { username: 'l2hectest', password: 'l2hectest' },
  viewerUser: { username: 'l1hectest', password: 'l1hectest' },
};

// Token cache
const tokenCache = {};

// Get OAuth token for a user
function getToken(userKey) {
  if (tokenCache[userKey]) {
    return tokenCache[userKey];
  }

  const user = TEST_USERS[userKey];
  const tokenUrl = `${KEYCLOAK_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const response = http.post(tokenUrl, {
    username: user.username,
    password: user.password,
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
  }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.status === 200) {
    const data = JSON.parse(response.body);
    tokenCache[userKey] = data.access_token;
    return data.access_token;
  }

  console.error(`Failed to get token for ${userKey}: ${response.status}`);
  return null;
}

// Scenario configurations
export const options = {
  scenarios: {
    // Scenario 1: Public endpoint baseline
    public_endpoints: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'publicEndpoints',
      tags: { scenario: 'public' },
    },

    // Scenario 2: Authenticated requests with warm cache
    authenticated_warm_cache: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '35s',
      exec: 'authenticatedWarmCache',
      tags: { scenario: 'auth_warm' },
    },

    // Scenario 3: Authenticated requests with cold cache (varied users)
    authenticated_cold_cache: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      startTime: '70s',
      exec: 'authenticatedColdCache',
      tags: { scenario: 'auth_cold' },
    },

    // Scenario 4: Direct authorization endpoint
    authorization_endpoint: {
      executor: 'constant-vus',
      vus: 15,
      duration: '30s',
      startTime: '85s',
      exec: 'authorizationEndpoint',
      tags: { scenario: 'authorize' },
    },

    // Scenario 5: Stress test - ramping VUs
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '15s', target: 0 },
      ],
      startTime: '120s',
      exec: 'stressTest',
      tags: { scenario: 'stress' },
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    authorization_latency: ['p(95)<100'],
  },
};

// Scenario 1: Public endpoints (no auth)
export function publicEndpoints() {
  const healthResponse = http.get(`${PROXY_URL}/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response is healthy': (r) => {
      const body = JSON.parse(r.body);
      return body.status === 'healthy';
    },
  });

  const readyResponse = http.get(`${PROXY_URL}/ready`);
  check(readyResponse, {
    'ready status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}

// Scenario 2: Authenticated with warm cache (same user repeatedly)
export function authenticatedWarmCache() {
  const token = getToken('damOperator');
  if (!token) {
    console.error('No token available for damOperator');
    return;
  }

  const startTime = Date.now();
  const response = http.get(`${PROXY_URL}/cwms-data/timeseries?office=SWT&name=TestTs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const latency = Date.now() - startTime;
  authorizationLatency.add(latency);

  const success = response.status === 200 || response.status === 404;
  opaEvaluationSuccess.add(success);

  // Check if response suggests cache hit (faster responses indicate cache)
  if (latency < 50) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }

  check(response, {
    'authenticated request succeeds': (r) => r.status === 200 || r.status === 404,
    'not forbidden': (r) => r.status !== 403,
  });

  sleep(0.05);
}

// Scenario 3: Cold cache scenario (different query params)
export function authenticatedColdCache() {
  const users = ['damOperator', 'waterManager', 'viewerUser'];
  const userKey = users[__VU % users.length];
  const token = getToken(userKey);

  if (!token) {
    console.error(`No token available for ${userKey}`);
    return;
  }

  // Use unique query to avoid cache hits
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const startTime = Date.now();

  const response = http.get(`${PROXY_URL}/cwms-data/timeseries?office=SWT&name=ColdTest-${uniqueId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const latency = Date.now() - startTime;
  authorizationLatency.add(latency);

  check(response, {
    'cold cache request processed': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.1);
}

// Scenario 4: Direct /authorize endpoint
export function authorizationEndpoint() {
  const token = getToken('damOperator');

  const payload = JSON.stringify({
    resource: 'timeseries',
    action: 'read',
    jwt_token: token,
    context: {
      office_id: 'SWT',
    },
  });

  const startTime = Date.now();
  const response = http.post(`${PROXY_URL}/authorize`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const latency = Date.now() - startTime;
  authorizationLatency.add(latency);

  check(response, {
    'authorize returns 200': (r) => r.status === 200,
    'authorize returns decision': (r) => {
      if (r.status !== 200) return false;
      const body = JSON.parse(r.body);
      return body.decision && typeof body.decision.allow === 'boolean';
    },
  });

  sleep(0.05);
}

// Scenario 5: Stress test
export function stressTest() {
  const token = getToken('damOperator');

  // Mix of different request types
  const requestType = Math.random();

  if (requestType < 0.3) {
    // Health check
    http.get(`${PROXY_URL}/health`);
  } else if (requestType < 0.6) {
    // Authenticated timeseries
    http.get(`${PROXY_URL}/cwms-data/timeseries?office=SWT`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    // Authorize endpoint
    http.post(`${PROXY_URL}/authorize`, JSON.stringify({
      resource: 'timeseries',
      action: 'read',
      jwt_token: token,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  sleep(0.01);
}

// Setup function - runs once before all scenarios
export function setup() {
  console.log('Warming up token cache...');

  // Pre-fetch tokens for all users
  for (const userKey of Object.keys(TEST_USERS)) {
    const token = getToken(userKey);
    if (token) {
      console.log(`Token obtained for ${userKey}`);
    } else {
      console.error(`Failed to get token for ${userKey}`);
    }
  }

  // Verify proxy is accessible
  const healthCheck = http.get(`${PROXY_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Proxy not accessible at ${PROXY_URL}`);
  }

  console.log('Setup complete');
  return { startTime: Date.now() };
}

// Teardown function - runs once after all scenarios
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Benchmark completed in ${duration.toFixed(2)} seconds`);
}
