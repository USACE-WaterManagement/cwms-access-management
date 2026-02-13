import { describe, it, expect } from 'vitest';

import { transformApiUser } from '../../../../apps/services/authorizer-proxy/src/utils/api.utils';

describe('transformApiUser', () => {
  it('transforms API response to User object', () => {
    const apiUser = {
      'user-name': 'M5HECTEST',
      principal: 'issuer::subject',
      email: 'test@usace.mil',
      roles: {
        SWT: ['CWMS Users', 'dam_operator'],
        HQ: ['All Users', 'dam_operator'],
      },
      'ts-group-privileges': [
        { 'ts-group-code': 0, 'ts-group-id': 'All TS Ids', privilege: 'read', 'embargo-hours': 0 },
      ],
    };

    const user = transformApiUser(apiUser);

    expect(user.id).toBe('M5HECTEST');
    expect(user.username).toBe('M5HECTEST');
    expect(user.email).toBe('test@usace.mil');
    expect(user.offices).toContain('SWT');
    expect(user.offices).toContain('HQ');
    expect(user.roles).toContain('CWMS Users');
    expect(user.roles).toContain('dam_operator');
    expect(user.primary_office).toBe('SWT');
    expect(user.authenticated).toBe(true);
  });

  it('deduplicates roles across offices', () => {
    const apiUser = {
      'user-name': 'TEST',
      principal: 'x',
      roles: {
        SWT: ['dam_operator', 'CWMS Users'],
        HQ: ['dam_operator', 'All Users'],
      },
    };

    const user = transformApiUser(apiUser);
    const damOperatorCount = user.roles.filter((r) => r === 'dam_operator').length;
    expect(damOperatorCount).toBe(1);
  });

  it('defaults email to username@usace.mil when missing', () => {
    const apiUser = { 'user-name': 'TESTUSER', principal: 'x' };
    const user = transformApiUser(apiUser);
    expect(user.email).toBe('testuser@usace.mil');
  });

  it('transforms ts-group-privileges to snake_case', () => {
    const apiUser = {
      'user-name': 'TEST',
      principal: 'x',
      'ts-group-privileges': [
        { 'ts-group-code': 16, 'ts-group-id': 'policy-72h', privilege: 'read', 'embargo-hours': 72 },
      ],
    };

    const user = transformApiUser(apiUser);
    expect(user.ts_privileges?.[0]).toEqual({
      ts_group_code: 16,
      ts_group_id: 'policy-72h',
      privilege: 'read',
      embargo_hours: 72,
    });
  });

  it('handles user with no roles', () => {
    const apiUser = {
      'user-name': 'NOROLESUSER',
      principal: 'x',
    };

    const user = transformApiUser(apiUser);
    expect(user.roles).toEqual([]);
    expect(user.offices).toEqual([]);
  });

  it('handles user with no ts-group-privileges', () => {
    const apiUser = {
      'user-name': 'NOPRIVS',
      principal: 'x',
      roles: { SWT: ['viewer'] },
    };

    const user = transformApiUser(apiUser);
    expect(user.ts_privileges).toBeUndefined();
  });
});
