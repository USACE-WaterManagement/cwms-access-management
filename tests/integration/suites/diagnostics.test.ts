import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getToken, clearTokenCache } from '../helpers/auth.js';
import { directApiRequest, proxyRequest, opaRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';
import { testLogger } from '../helpers/logger.js';

describe('Diagnostics - User Context Verification', () => {
  beforeAll(() => {
    clearTokenCache();
  });

  afterAll(() => {
    clearTokenCache();
  });

  describe('Token Retrieval', () => {
    it('should get token for damOperator (damop001)', async () => {
      const token = await getToken('damOperator');
      testLogger.debug(`damOperator token: ${token ? 'obtained' : 'FAILED'}`);
      expect(token).toBeTruthy();
    });

    it('should get token for waterManager (m5hectest)', async () => {
      const token = await getToken('waterManager');
      testLogger.debug(`waterManager token: ${token ? 'obtained' : 'FAILED'}`);
      expect(token).toBeTruthy();
    });

    it('should get token for limitedUser (l1hectest)', async () => {
      const token = await getToken('limitedUser');
      testLogger.debug(`limitedUser token: ${token ? 'obtained' : 'FAILED'}`);
      expect(token).toBeTruthy();
    });
  });

  describe('User Profile from API', () => {
    it('should fetch user profile for damOperator via API', async () => {
      const token = await getToken('damOperator');
      const response = await directApiRequest('/cwms-data/user/profile', {
        token,
      });

      testLogger.debug(`damOperator profile status: ${response.status}`);
      testLogger.debug(`damOperator profile: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });

    it('should fetch user profile for waterManager via API', async () => {
      const token = await getToken('waterManager');
      const response = await directApiRequest('/cwms-data/user/profile', {
        token,
      });

      testLogger.debug(`waterManager profile status: ${response.status}`);
      testLogger.debug(`waterManager profile: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });

    it('should fetch user profile for limitedUser via API', async () => {
      const token = await getToken('limitedUser');
      const response = await directApiRequest('/cwms-data/user/profile', {
        token,
      });

      testLogger.debug(`limitedUser profile status: ${response.status}`);
      testLogger.debug(`limitedUser profile: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });
  });

  describe('Authorization Proxy Context', () => {
    it('should get authorization context for damOperator via proxy /authorize', async () => {
      const token = await getToken('damOperator');
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPK' },
        },
      });

      testLogger.debug(`damOperator authorize status: ${response.status}`);
      testLogger.debug(`damOperator context: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });

    it('should get authorization context for limitedUser via proxy /authorize', async () => {
      const token = await getToken('limitedUser');
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'HQ' },
        },
      });

      testLogger.debug(`limitedUser authorize status: ${response.status}`);
      testLogger.debug(`limitedUser context: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });
  });

  describe('OPA Policy Direct Test', () => {
    it('should allow dam_operator role for own office timeseries', async () => {
      const response = await opaRequest('/v1/data/cwms/authz/allow', {
        method: 'POST',
        body: {
          input: {
            user: {
              username: config.testUsers.damOperator.username,
              roles: config.testUsers.damOperator.expectedRoles,
              offices: [config.testUsers.damOperator.expectedOffice],
            },
            resource: 'timeseries',
            action: 'read',
            context: { office_id: config.testUsers.damOperator.expectedOffice },
          },
        },
      });

      expect(response.ok).toBe(true);
      const data = response.data as { result: boolean };
      expect(data.result).toBe(true);
    });

    it('should deny public_user role for timeseries without classification=public', async () => {
      const response = await opaRequest('/v1/data/cwms/authz/allow', {
        method: 'POST',
        body: {
          input: {
            user: {
              username: config.testUsers.limitedUser.username,
              roles: config.testUsers.limitedUser.expectedRoles,
              offices: [config.testUsers.limitedUser.expectedOffice, 'HQ'],
            },
            resource: 'timeseries',
            action: 'read',
            context: { office_id: 'HQ' },
          },
        },
      });

      expect(response.ok).toBe(true);
      const data = response.data as { result: boolean };
      expect(data.result).toBe(false);
    });

    it('should deny empty roles for timeseries access', async () => {
      const response = await opaRequest('/v1/data/cwms/authz/allow', {
        method: 'POST',
        body: {
          input: {
            user: {
              username: 'test',
              roles: [],
              offices: [],
            },
            resource: 'timeseries',
            action: 'read',
            context: { office_id: 'HQ' },
          },
        },
      });

      expect(response.ok).toBe(true);
      const data = response.data as { result: boolean };
      expect(data.result).toBe(false);
    });
  });
});
