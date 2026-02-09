import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getToken, clearTokenCache } from '../helpers/auth.js';
import { proxyRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';
import { testLogger } from '../helpers/logger.js';

describe('Limited User (l1hectest)', () => {
  let token: string;
  const userConfig = config.testUsers.limitedUser;

  beforeAll(async () => {
    token = await getToken('limitedUser');
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

  describe('Public Resources Access', () => {
    it('should allow access to offices', async () => {
      const response = await proxyRequest('/cwms-data/offices', { token });
      expect(response.status).toBe(200);
    });

    it('should allow access to units', async () => {
      const response = await proxyRequest('/cwms-data/units', { token });
      expect(response.status).toBe(200);
    });

    it('should allow access to parameters', async () => {
      const response = await proxyRequest('/cwms-data/parameters', { token });
      expect(response.status).toBe(200);
    });

    it('should allow access to timezones', async () => {
      const response = await proxyRequest('/cwms-data/timezones', { token });
      expect(response.status).toBe(200);
    });
  });

  describe('Restricted Data Access', () => {
    it('should deny timeseries access without classification=public', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=HQ&name=Test', {
        token,
      });
      testLogger.debug(`Timeseries access (HQ, no classification): status=${response.status}`);
      expect(response.status).toBe(403);
    });

    it('should deny locations access without classification=public', async () => {
      const response = await proxyRequest('/cwms-data/locations?office=HQ', {
        token,
      });
      testLogger.debug(`Locations access (HQ): status=${response.status}`);
      expect(response.status).toBe(403);
    });

    it('should deny levels access without classification=public', async () => {
      const response = await proxyRequest('/cwms-data/levels?office=HQ', {
        token,
      });
      testLogger.debug(`Levels access (HQ): status=${response.status}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Office-Based Restrictions', () => {
    it('should deny access to data in unauthorized office (SWT)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SWT&name=Test', {
        token,
      });
      testLogger.debug(`Unauthorized office (SWT) access: status=${response.status}`);
      expect(response.status).toBe(403);
    });

    it('should deny timeseries in own office without classification=public', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SPL&name=Test', {
        token,
      });
      testLogger.debug(`Own office (SPL) access without classification: status=${response.status}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Write Operations', () => {
    it('should deny POST operations (public_user is read-only)', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=HQ', {
        method: 'POST',
        token,
        body: {},
      });
      testLogger.debug(`POST timeseries: status=${response.status}`);
      expect(response.status).toBe(403);
    });
  });
});
