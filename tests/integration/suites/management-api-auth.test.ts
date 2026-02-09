import { describe, it, expect, beforeAll } from 'vitest';
import { managementApiRequest } from '../helpers/http.js';
import { config } from '../setup/config.js';

const TEST_USER = config.testUsers.damOperator;

interface LoginResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    username: string;
  };
  error?: string;
}

interface LogoutResponse {
  success: boolean;
  error?: string;
}

interface RefreshResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  error?: string;
}

describe('Management API Authentication', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const healthResponse = await managementApiRequest('/health');
    if (!healthResponse.ok) {
      throw new Error(`Management API is not available at ${config.managementApi.url}`);
    }
  });

  describe('POST /login', () => {
    it('returns tokens for valid credentials', async () => {
      const response = await managementApiRequest('/login', {
        method: 'POST',
        body: {
          username: TEST_USER.username,
          password: TEST_USER.password,
        },
      });

      expect(response.status).toBe(200);

      const data = response.data as LoginResponse;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data?.access_token).toBeDefined();
      expect(data.data?.refresh_token).toBeDefined();
      expect(data.data?.expires_in).toBeGreaterThan(0);
      expect(data.data?.token_type).toBe('Bearer');
      expect(data.data?.username).toBe(TEST_USER.username);

      accessToken = data.data!.access_token;
      refreshToken = data.data!.refresh_token;
    });

    it('returns 400 for missing username', async () => {
      const response = await managementApiRequest('/login', {
        method: 'POST',
        body: { password: 'somepassword' },
      });

      expect(response.status).toBe(400);

      const data = response.data as LoginResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('returns 400 for missing password', async () => {
      const response = await managementApiRequest('/login', {
        method: 'POST',
        body: { username: 'someuser' },
      });

      expect(response.status).toBe(400);

      const data = response.data as LoginResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('returns 401 for invalid credentials', async () => {
      const response = await managementApiRequest('/login', {
        method: 'POST',
        body: {
          username: TEST_USER.username,
          password: 'wrongpassword',
        },
      });

      expect(response.status).toBe(401);

      const data = response.data as LoginResponse;
      expect(data.success).toBe(false);
    });
  });

  describe('POST /refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      expect(refreshToken).toBeDefined();

      const response = await managementApiRequest('/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });

      expect(response.status).toBe(200);

      const data = response.data as RefreshResponse;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data?.access_token).toBeDefined();
      expect(data.data?.refresh_token).toBeDefined();

      refreshToken = data.data!.refresh_token;
    });

    it('returns 400 for missing refresh_token', async () => {
      const response = await managementApiRequest('/refresh', {
        method: 'POST',
        body: {},
      });

      expect(response.status).toBe(400);

      const data = response.data as RefreshResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('returns 401 for invalid refresh token', async () => {
      const response = await managementApiRequest('/refresh', {
        method: 'POST',
        body: { refresh_token: 'invalid-token' },
      });

      expect(response.status).toBe(401);

      const data = response.data as RefreshResponse;
      expect(data.success).toBe(false);
    });
  });

  describe('POST /logout', () => {
    it('returns 400 for missing refresh_token', async () => {
      const response = await managementApiRequest('/logout', {
        method: 'POST',
        body: {},
      });

      expect(response.status).toBe(400);

      const data = response.data as LogoutResponse;
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('successfully logs out with valid refresh token', async () => {
      expect(refreshToken).toBeDefined();

      const response = await managementApiRequest('/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });

      expect(response.status).toBe(200);

      const data = response.data as LogoutResponse;
      expect(data.success).toBe(true);
    });

    it('refresh token is invalidated after logout', async () => {
      const response = await managementApiRequest('/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected endpoints', () => {
    it('can access protected endpoint with valid token', async () => {
      const loginResponse = await managementApiRequest('/login', {
        method: 'POST',
        body: {
          username: TEST_USER.username,
          password: TEST_USER.password,
        },
      });

      const loginData = loginResponse.data as LoginResponse;
      const token = loginData.data?.access_token;

      const response = await managementApiRequest('/roles', {
        token,
      });

      // Token is accepted (not 401), CDA may return 403 for non-admin users
      expect(response.status).not.toBe(401);
    });

    it('returns 401 for protected endpoint without token', async () => {
      const response = await managementApiRequest('/roles');
      expect(response.status).toBe(401);
    });

    it('returns 401 for protected endpoint with invalid token', async () => {
      const response = await managementApiRequest('/roles', {
        token: 'invalid-token',
      });
      expect(response.status).toBe(401);
    });
  });
});
