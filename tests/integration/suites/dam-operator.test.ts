import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getToken, clearTokenCache } from '../helpers/auth.js';
import { proxyRequest, directApiRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';
import { testLogger } from '../helpers/logger.js';

describe('Dam Operator (damop001)', () => {
  let token: string;
  const userConfig = config.testUsers.damOperator;

  beforeAll(async () => {
    token = await getToken('damOperator');
    expect(token).toBeTruthy();
  });

  afterAll(() => {
    clearTokenCache();
  });

  describe('Authentication', () => {
    it('should obtain valid JWT token from Keycloak', () => {
      expect(token.length).toBeGreaterThan(0);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('Office-Based Access', () => {
    it('should allow read access to timeseries in own office (SPK)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SPK&name=Test', {
        token,
      });
      testLogger.debug(`SPK timeseries: status=${response.status}`);
      expect(response.status).not.toBe(403);
    });

    it('should deny read access to timeseries in other office (SWT)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SWT&name=Test', {
        token,
      });
      testLogger.debug(`SWT access response: ${response.status}`);
      expect(response.status).toBe(403);
    });

    it('should allow read access to locations in own office (SPK)', async () => {
      const response = await proxyRequest('/cwms-data/locations?office=SPK', {
        token,
      });
      testLogger.debug(`SPK locations: status=${response.status}`);
      expect(response.status).toBe(200);
    });

    it('should allow read access to levels in own office (SPK)', async () => {
      const response = await proxyRequest('/cwms-data/levels?office=SPK', {
        token,
      });
      testLogger.debug(`SPK levels: status=${response.status}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Public Resources', () => {
    it('should always allow access to offices', async () => {
      const response = await proxyRequest('/cwms-data/offices', { token });
      expect(response.status).toBe(200);
    });

    it('should always allow access to units', async () => {
      const response = await proxyRequest('/cwms-data/units', { token });
      expect(response.status).toBe(200);
    });

    it('should always allow access to parameters', async () => {
      const response = await proxyRequest('/cwms-data/parameters', { token });
      expect(response.status).toBe(200);
    });
  });

  describe('User Profile Verification', () => {
    it('should retrieve auth keys from CDA', async () => {
      const response = await directApiRequest('/cwms-data/auth/keys', {
        token,
      });
      testLogger.debug(`Auth keys response: ${response.status}`);
      expect(response.ok).toBe(true);
    });
  });
});
