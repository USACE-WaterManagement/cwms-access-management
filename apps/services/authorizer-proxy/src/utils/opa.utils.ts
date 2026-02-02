import { AuthorizationContext } from '../types/authorization';

export function generateOpaCacheKey(context: { user: { id: string }; resource: string; action: string; path: string }): string {
  return `${context.user.id}:${context.resource}:${context.action}:${context.path}`;
}
