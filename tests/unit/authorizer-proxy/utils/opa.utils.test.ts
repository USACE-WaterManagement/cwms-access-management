import { describe, it, expect } from 'vitest';

import { generateOpaCacheKey } from '../../../../apps/services/authorizer-proxy/src/utils/opa.utils';

describe('generateOpaCacheKey', () => {
  it('generates consistent cache key', () => {
    const context = {
      user: { id: 'user1' },
      resource: 'timeseries',
      action: 'read',
      path: '/cwms-data/timeseries',
    };
    expect(generateOpaCacheKey(context)).toBe('user1:timeseries:read:/cwms-data/timeseries');
  });

  it('handles anonymous user', () => {
    const context = {
      user: { id: 'anonymous' },
      resource: 'offices',
      action: 'read',
      path: '/cwms-data/offices',
    };
    expect(generateOpaCacheKey(context)).toBe('anonymous:offices:read:/cwms-data/offices');
  });

  it('handles complex paths', () => {
    const context = {
      user: { id: 'm5hectest' },
      resource: 'timeseries',
      action: 'create',
      path: '/cwms-data/timeseries/groups',
    };
    expect(generateOpaCacheKey(context)).toBe('m5hectest:timeseries:create:/cwms-data/timeseries/groups');
  });

  it('produces different keys for different users on the same resource', () => {
    const base = { resource: 'timeseries', action: 'read', path: '/cwms-data/timeseries' };
    const key1 = generateOpaCacheKey({ ...base, user: { id: 'user_a' } });
    const key2 = generateOpaCacheKey({ ...base, user: { id: 'user_b' } });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different actions on the same resource', () => {
    const base = { user: { id: 'user1' }, resource: 'timeseries', path: '/cwms-data/timeseries' };
    const readKey = generateOpaCacheKey({ ...base, action: 'read' });
    const createKey = generateOpaCacheKey({ ...base, action: 'create' });
    expect(readKey).not.toBe(createKey);
  });

  it('handles empty string fields without error', () => {
    const context = {
      user: { id: '' },
      resource: '',
      action: '',
      path: '',
    };
    const key = generateOpaCacheKey(context);
    expect(key).toBe(':::');
  });

  it('preserves special characters in user id', () => {
    const context = {
      user: { id: 'user:with:colons' },
      resource: 'timeseries',
      action: 'read',
      path: '/cwms-data/timeseries',
    };
    const key = generateOpaCacheKey(context);
    expect(key).toContain('user:with:colons');
  });
});
