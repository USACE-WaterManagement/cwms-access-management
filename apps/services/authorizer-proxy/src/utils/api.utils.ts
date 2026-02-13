import { User, TsGroupPrivilege } from '../types/authorization';

interface CwmsApiTsGroupPrivilege {
  'ts-group-code': number;
  'ts-group-id': string;
  privilege: string;
  'embargo-hours': number;
}

interface CwmsApiUser {
  'user-name': string;
  principal: string;
  email?: string;
  'cac-auth'?: boolean;
  roles?: Record<string, string[]>;
  'ts-group-privileges'?: CwmsApiTsGroupPrivilege[];
}

export function transformApiUser(apiUser: CwmsApiUser): User {
  const allRoles: string[] = [];
  const offices: string[] = [];

  if (apiUser.roles) {
    for (const [office, roleList] of Object.entries(apiUser.roles)) {
      offices.push(office);
      allRoles.push(...roleList);
    }
  }

  const primaryOffice = offices.length > 0 ? offices[0] : undefined;

  const tsPrivileges: TsGroupPrivilege[] = (apiUser['ts-group-privileges'] || []).map((p) => ({
    ts_group_code: p['ts-group-code'],
    ts_group_id: p['ts-group-id'],
    privilege: p.privilege as TsGroupPrivilege['privilege'],
    embargo_hours: p['embargo-hours'],
  }));

  return {
    id: apiUser['user-name'],
    username: apiUser['user-name'],
    email: apiUser.email || `${apiUser['user-name'].toLowerCase()}@usace.mil`,
    roles: Array.from(new Set(allRoles)),
    offices: Array.from(new Set(offices)),
    primary_office: primaryOffice,
    authenticated: true,
    ts_privileges: tsPrivileges.length > 0 ? tsPrivileges : undefined,
  };
}
