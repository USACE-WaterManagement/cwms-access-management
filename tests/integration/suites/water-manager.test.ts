import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getToken, clearTokenCache } from '../helpers/auth.js';
import { proxyRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';
import { testLogger } from '../helpers/logger.js';

describe('Water Manager (m5hectest)', () => {
  let token: string;
  const userConfig = config.testUsers.waterManager;

  beforeAll(async () => {
    token = await getToken('waterManager');
    expect(token).toBeTruthy();
  });

  afterAll(() => {
    clearTokenCache();
  });

  describe('Authentication', () => {
    it('should obtain valid JWT token from Keycloak', () => {
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('Office-Based Access', () => {
    it('should allow read access to timeseries in own office (SWT)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SWT&name=Test', {
        token,
      });
      testLogger.debug(`SWT timeseries: status=${response.status}`);
      expect(response.status).not.toBe(403);
    });

    it('should deny read access to timeseries in other office (SPK)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SPK&name=Test', {
        token,
      });
      testLogger.debug(`SPK access response: ${response.status}`);
      expect(response.status).toBe(403);
    });

    it('should allow read access to locations in own office (SWT)', async () => {
      const response = await proxyRequest('/cwms-data/locations?office=SWT', {
        token,
      });
      testLogger.debug(`SWT locations: status=${response.status}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Embargo Exemption', () => {
    it('should be embargo exempt as water_manager', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      testLogger.debug(`Embargo exempt check: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);

      const data = response.data as { constraints?: { embargo_exempt: boolean } };
      expect(data.constraints?.embargo_exempt).toBe(true);
    });
  });

  describe('Public Resources', () => {
    it('should always allow access to offices', async () => {
      const response = await proxyRequest('/cwms-data/offices', { token });
      expect(response.status).toBe(200);
    });
  });
});
