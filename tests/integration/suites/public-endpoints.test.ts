import { describe, it, expect } from 'vitest';
import { proxyRequest, directApiRequest } from '../helpers/http.js';

describe('Public Endpoints', () => {
  describe('Unauthenticated Access', () => {
    it('should allow access to /offices without authentication', async () => {
      const response = await proxyRequest('/cwms-data/offices');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should allow access to /units without authentication', async () => {
      const response = await proxyRequest('/cwms-data/units');
      expect(response.status).toBe(200);
    });

    it('should allow access to /parameters without authentication', async () => {
      const response = await proxyRequest('/cwms-data/parameters');
      expect(response.status).toBe(200);
    });

    it('should allow access to /timezones without authentication', async () => {
      const response = await proxyRequest('/cwms-data/timezones');
      expect(response.status).toBe(200);
    });
  });

  describe('Unauthenticated Denial', () => {
    it('should deny unauthenticated timeseries access without classification', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SWT&name=Test');
      expect(response.status).toBe(403);
    });

    it('should allow unauthenticated timeseries access with classification=public', async () => {
      const response = await proxyRequest('/cwms-data/timeseries?office=SWT&name=Test&classification=public');
      // Proxy authorizes (not 403), CDA may return 400/404 for anonymous requests
      expect(response.status).not.toBe(403);
    });
  });

  describe('Proxy vs Direct API Comparison', () => {
    it('should return same data through proxy as direct API for /offices', async () => {
      const proxyResponse = await proxyRequest('/cwms-data/offices');
      const directResponse = await directApiRequest('/cwms-data/offices');

      expect(proxyResponse.status).toBe(directResponse.status);
      expect(proxyResponse.data).toEqual(directResponse.data);
    });
  });

  describe('Health Endpoints', () => {
    it('proxy health check should return healthy', async () => {
      const response = await proxyRequest('/health');
      expect(response.status).toBe(200);
      const data = response.data as { status: string };
      expect(data.status).toBe('healthy');
    });
  });
});
