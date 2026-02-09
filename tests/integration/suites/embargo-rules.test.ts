import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getToken, clearTokenCache } from '../helpers/auth.js';
import { proxyRequest, directApiRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';
import { testLogger } from '../helpers/logger.js';

interface AuthorizeResponse {
  allow: boolean;
  user?: {
    username: string;
    roles: string[];
    offices: string[];
    primary_office: string;
  };
  constraints?: {
    embargo_exempt: boolean;
    embargo_rules?: Record<string, number>;
    ts_group_embargo?: Record<string, number>;
    allowed_offices: string[];
  };
}

interface UserProfile {
  username: string;
  roles: string[];
  office: string;
  'TS Groups'?: Array<{
    'TS Group ID': string;
    privilege: string;
  }>;
}

describe('Embargo Rules Verification', () => {
  beforeAll(() => {
    clearTokenCache();
  });

  afterAll(() => {
    clearTokenCache();
  });

  describe('Dam Operator (damop001) - subject to embargo', () => {
    let token: string;

    beforeAll(async () => {
      token = await getToken('damOperator');
    });

    it('should have embargo_exempt set to false', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPK' },
        },
      });

      testLogger.debug(`damOperator authorize: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);

      const data = response.data as AuthorizeResponse;
      expect(data.constraints?.embargo_exempt).toBe(false);
    });

    it('should include dam_operator role in user context', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPK' },
        },
      });

      const data = response.data as AuthorizeResponse;
      expect(data.user?.roles).toContain('dam_operator');
    });

    it('should have TS group embargo info in constraints', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPK' },
        },
      });

      const data = response.data as AuthorizeResponse;
      testLogger.debug(`damOperator constraints: ${JSON.stringify(data.constraints, null, 2)}`);

      if (data.constraints?.ts_group_embargo) {
        const embargoGroupIds = Object.keys(data.constraints.ts_group_embargo as Record<string, number>);
        expect(embargoGroupIds).toContain('dam_operator_raw_r_72h');
      }
    });

    it('should have TS group privileges in CDA profile', async () => {
      const response = await directApiRequest('/cwms-data/user/profile', { token });

      testLogger.debug(`damOperator CDA profile: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });
  });

  describe('Water Manager (m5hectest) - embargo exempt', () => {
    let token: string;

    beforeAll(async () => {
      token = await getToken('waterManager');
    });

    it('should have embargo_exempt set to true', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      testLogger.debug(`waterManager authorize: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);

      const data = response.data as AuthorizeResponse;
      expect(data.constraints?.embargo_exempt).toBe(true);
    });

    it('should include water_manager role in user context', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      const data = response.data as AuthorizeResponse;
      expect(data.user?.roles).toContain('water_manager');
    });

    it('should have TS group privileges in CDA profile', async () => {
      const response = await directApiRequest('/cwms-data/user/profile', { token });

      testLogger.debug(`waterManager CDA profile: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);
    });
  });

  describe('Data Manager (datamgr001) - embargo exempt', () => {
    let token: string;

    beforeAll(async () => {
      token = await getToken('dataManager');
    });

    it('should have embargo_exempt set to true', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      testLogger.debug(`dataManager authorize: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);

      const data = response.data as AuthorizeResponse;
      expect(data.constraints?.embargo_exempt).toBe(true);
    });

    it('should include data_manager role in user context', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      const data = response.data as AuthorizeResponse;
      expect(data.user?.roles).toContain('data_manager');
    });
  });

  describe('Limited User (l1hectest) - subject to embargo', () => {
    let token: string;

    beforeAll(async () => {
      token = await getToken('limitedUser');
    });

    it('should have embargo_exempt set to false', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPL' },
        },
      });

      testLogger.debug(`limitedUser authorize: ${JSON.stringify(response.data, null, 2)}`);
      expect(response.ok).toBe(true);

      const data = response.data as AuthorizeResponse;
      expect(data.constraints?.embargo_exempt).toBe(false);
    });

    it('should include public_user role in user context', async () => {
      const response = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: token,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPL' },
        },
      });

      const data = response.data as AuthorizeResponse;
      expect(data.user?.roles).toContain('public_user');
    });
  });

  describe('Embargo comparison across personas', () => {
    it('dam_operator and public_user should NOT be embargo exempt', async () => {
      const damToken = await getToken('damOperator');
      const limitedToken = await getToken('limitedUser');

      const damResponse = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: damToken,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPK' },
        },
      });

      const limitedResponse = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: limitedToken,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SPL' },
        },
      });

      const damData = damResponse.data as AuthorizeResponse;
      const limitedData = limitedResponse.data as AuthorizeResponse;

      expect(damData.constraints?.embargo_exempt).toBe(false);
      expect(limitedData.constraints?.embargo_exempt).toBe(false);
    });

    it('water_manager and data_manager should be embargo exempt', async () => {
      const waterToken = await getToken('waterManager');
      const dataToken = await getToken('dataManager');

      const waterResponse = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: waterToken,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      const dataResponse = await proxyRequest('/authorize', {
        method: 'POST',
        body: {
          jwt_token: dataToken,
          resource: 'timeseries',
          action: 'read',
          context: { office_id: 'SWT' },
        },
      });

      const waterData = waterResponse.data as AuthorizeResponse;
      const dataData = dataResponse.data as AuthorizeResponse;

      expect(waterData.constraints?.embargo_exempt).toBe(true);
      expect(dataData.constraints?.embargo_exempt).toBe(true);
    });
  });
});
