import { User, TsGroupPrivilege } from '../types/authorization';

export function extractResource(url: string): string {
  const pathWithoutQuery = url.split('?')[0];
  const pathParts = pathWithoutQuery.split('/').filter(Boolean);

  if (pathParts.length >= 2 && pathParts[0] === 'cwms-data') {
    return pathParts[1];
  }

  return pathParts[0] || 'unknown';
}

export function extractAction(method: string): string {
  const methodToAction: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  return methodToAction[method] || 'unknown';
}

export function actionToMethod(action: string): string {
  const actionToMethod: Record<string, string> = {
    read: 'GET',
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  };
  return actionToMethod[action] || 'GET';
}

export function isEmbargoExempt(user: Partial<User>): boolean {
  const exemptPersonas = ['data_manager', 'water_manager', 'system_admin'];
  const exemptRoles = ['system_admin', 'hec_employee', 'data_manager', 'water_manager'];

  if (user.persona && exemptPersonas.includes(user.persona)) {
    return true;
  }

  return user.roles?.some((role) => exemptRoles.includes(role)) || false;
}

export function getTimeWindow(user: Partial<User>): { restrict_hours: number } | null {
  if (user.persona === 'dam_operator') {
    return { restrict_hours: 8 };
  }
  return null;
}

export function getAllowedOffices(user: Partial<User>): string[] {
  if (user.persona === 'automated_processor' || user.roles?.includes('system_admin')) {
    return ['*'];
  }
  return user.offices || [];
}

export function getAllowedClassifications(user: Partial<User>): string[] {
  if (user.roles?.includes('system_admin') || user.roles?.includes('hec_employee')) {
    return ['public', 'internal', 'restricted', 'sensitive'];
  }

  if (user.persona === 'data_manager' || user.roles?.includes('water_manager')) {
    return ['public', 'internal', 'restricted', 'sensitive'];
  }

  if (user.authenticated) {
    return ['public', 'internal'];
  }

  return ['public'];
}

export function buildTsGroupEmbargo(privileges?: TsGroupPrivilege[]): Record<string, number> | null {
  if (!privileges || privileges.length === 0) {
    return null;
  }

  const embargoMap: Record<string, number> = {};
  for (const priv of privileges) {
    embargoMap[priv.ts_group_id] = priv.embargo_hours;
  }

  return embargoMap;
}

export function isPathWhitelisted(path: string, whitelist: string[]): boolean {
  const cleanPath = path.split('?')[0];
  return whitelist.includes(cleanPath);
}
