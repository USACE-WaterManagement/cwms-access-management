import { describe, it, expect } from 'vitest';

import {
  extractResource,
  extractAction,
  actionToMethod,
  isEmbargoExempt,
  getTimeWindow,
  getAllowedOffices,
  getAllowedClassifications,
  buildTsGroupEmbargo,
  isPathWhitelisted,
} from '../../../../apps/services/authorizer-proxy/src/utils/authorization.utils';

describe('extractResource', () => {
  it('extracts resource from cwms-data path', () => {
    expect(extractResource('/cwms-data/timeseries?office=SWT')).toBe('timeseries');
  });

  it('handles path without query params', () => {
    expect(extractResource('/cwms-data/offices')).toBe('offices');
  });

  it('handles non-cwms-data path', () => {
    expect(extractResource('/health')).toBe('health');
  });

  it('handles empty path', () => {
    expect(extractResource('/')).toBe('unknown');
  });

  it('handles nested cwms-data paths', () => {
    expect(extractResource('/cwms-data/timeseries/groups')).toBe('timeseries');
  });
});

describe('extractAction', () => {
  it('maps GET to read', () => {
    expect(extractAction('GET')).toBe('read');
  });

  it('maps POST to create', () => {
    expect(extractAction('POST')).toBe('create');
  });

  it('maps PUT to update', () => {
    expect(extractAction('PUT')).toBe('update');
  });

  it('maps PATCH to update', () => {
    expect(extractAction('PATCH')).toBe('update');
  });

  it('maps DELETE to delete', () => {
    expect(extractAction('DELETE')).toBe('delete');
  });

  it('maps unknown method to unknown', () => {
    expect(extractAction('OPTIONS')).toBe('unknown');
  });
});

describe('actionToMethod', () => {
  it('maps read to GET', () => {
    expect(actionToMethod('read')).toBe('GET');
  });

  it('maps create to POST', () => {
    expect(actionToMethod('create')).toBe('POST');
  });

  it('maps update to PUT', () => {
    expect(actionToMethod('update')).toBe('PUT');
  });

  it('maps delete to DELETE', () => {
    expect(actionToMethod('delete')).toBe('DELETE');
  });

  it('defaults unknown to GET', () => {
    expect(actionToMethod('unknown')).toBe('GET');
  });
});

describe('isEmbargoExempt', () => {
  it('returns true for water_manager persona', () => {
    expect(isEmbargoExempt({ persona: 'water_manager', roles: [] })).toBe(true);
  });

  it('returns true for data_manager persona', () => {
    expect(isEmbargoExempt({ persona: 'data_manager', roles: [] })).toBe(true);
  });

  it('returns true for system_admin persona', () => {
    expect(isEmbargoExempt({ persona: 'system_admin', roles: [] })).toBe(true);
  });

  it('returns true for system_admin role', () => {
    expect(isEmbargoExempt({ roles: ['system_admin'] })).toBe(true);
  });

  it('returns true for hec_employee role', () => {
    expect(isEmbargoExempt({ roles: ['hec_employee'] })).toBe(true);
  });

  it('returns true for water_manager role', () => {
    expect(isEmbargoExempt({ roles: ['water_manager'] })).toBe(true);
  });

  it('returns false for dam_operator persona', () => {
    expect(isEmbargoExempt({ persona: 'dam_operator', roles: [] })).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(isEmbargoExempt({ roles: [] })).toBe(false);
  });

  it('returns false for non-exempt roles', () => {
    expect(isEmbargoExempt({ roles: ['cwms_user', 'viewer'] })).toBe(false);
  });
});

describe('getTimeWindow', () => {
  it('returns restrict_hours for dam_operator', () => {
    expect(getTimeWindow({ persona: 'dam_operator' })).toEqual({ restrict_hours: 8 });
  });

  it('returns null for water_manager', () => {
    expect(getTimeWindow({ persona: 'water_manager' })).toBeNull();
  });

  it('returns null for no persona', () => {
    expect(getTimeWindow({})).toBeNull();
  });

  it('returns null for data_manager', () => {
    expect(getTimeWindow({ persona: 'data_manager' })).toBeNull();
  });
});

describe('getAllowedOffices', () => {
  it('returns user offices', () => {
    expect(getAllowedOffices({ offices: ['SWT', 'SPK'] })).toEqual(['SWT', 'SPK']);
  });

  it('returns ["*"] for automated_processor persona', () => {
    expect(getAllowedOffices({ persona: 'automated_processor', offices: ['SWT'] })).toEqual(['*']);
  });

  it('returns ["*"] for system_admin role', () => {
    expect(getAllowedOffices({ roles: ['system_admin'], offices: [] })).toEqual(['*']);
  });

  it('returns empty array when no offices', () => {
    expect(getAllowedOffices({ offices: undefined })).toEqual([]);
  });

  it('returns empty array for empty user', () => {
    expect(getAllowedOffices({})).toEqual([]);
  });
});

describe('getAllowedClassifications', () => {
  it('returns all classifications for system_admin role', () => {
    expect(getAllowedClassifications({ roles: ['system_admin'] })).toEqual([
      'public',
      'internal',
      'restricted',
      'sensitive',
    ]);
  });

  it('returns all classifications for hec_employee role', () => {
    expect(getAllowedClassifications({ roles: ['hec_employee'] })).toEqual([
      'public',
      'internal',
      'restricted',
      'sensitive',
    ]);
  });

  it('returns all classifications for data_manager persona', () => {
    expect(getAllowedClassifications({ persona: 'data_manager' })).toEqual([
      'public',
      'internal',
      'restricted',
      'sensitive',
    ]);
  });

  it('returns all classifications for water_manager role', () => {
    expect(getAllowedClassifications({ roles: ['water_manager'] })).toEqual([
      'public',
      'internal',
      'restricted',
      'sensitive',
    ]);
  });

  it('returns public and internal for authenticated user', () => {
    expect(getAllowedClassifications({ authenticated: true, roles: [] })).toEqual(['public', 'internal']);
  });

  it('returns public only for unauthenticated user', () => {
    expect(getAllowedClassifications({ authenticated: false })).toEqual(['public']);
  });

  it('returns public only for empty user', () => {
    expect(getAllowedClassifications({})).toEqual(['public']);
  });
});

describe('buildTsGroupEmbargo', () => {
  it('builds map from privileges', () => {
    const privileges = [
      { ts_group_code: 0, ts_group_id: 'All TS Ids', privilege: 'read' as const, embargo_hours: 0 },
      { ts_group_code: 16, ts_group_id: 'policy-dam_operator-r-72h', privilege: 'read' as const, embargo_hours: 72 },
    ];
    expect(buildTsGroupEmbargo(privileges)).toEqual({
      'All TS Ids': 0,
      'policy-dam_operator-r-72h': 72,
    });
  });

  it('returns null for empty privileges', () => {
    expect(buildTsGroupEmbargo([])).toBeNull();
  });

  it('returns null for undefined privileges', () => {
    expect(buildTsGroupEmbargo(undefined)).toBeNull();
  });
});

describe('isPathWhitelisted', () => {
  const whitelist = ['/cwms-data/timeseries', '/cwms-data/offices'];

  it('matches whitelisted path exactly', () => {
    expect(isPathWhitelisted('/cwms-data/timeseries', whitelist)).toBe(true);
  });

  it('matches with query params stripped', () => {
    expect(isPathWhitelisted('/cwms-data/timeseries?office=SWT', whitelist)).toBe(true);
  });

  it('rejects non-whitelisted path', () => {
    expect(isPathWhitelisted('/cwms-data/levels', whitelist)).toBe(false);
  });

  it('rejects partial matches', () => {
    expect(isPathWhitelisted('/cwms-data/timeseries-groups', whitelist)).toBe(false);
  });

  it('handles empty whitelist', () => {
    expect(isPathWhitelisted('/cwms-data/timeseries', [])).toBe(false);
  });
});
