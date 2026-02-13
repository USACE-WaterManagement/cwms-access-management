import axios from 'axios';

import { logger } from '../utils/logger.js';
import type { Role, User } from '../types/index.js';

interface CdaUser {
  'user-name': string;
  principal: string;
  email: string | null;
  'cac-auth': boolean;
  roles: Record<string, string[]>;
  'ts-group-privileges'?: Array<{
    'ts-group-code': number;
    'ts-group-id': string;
    privilege: string;
    'embargo-hours': number;
  }>;
}

interface CdaUsersResponse {
  users: CdaUser[];
  page: string | null;
  'page-size': number;
  total: number;
}

export class CdaService {
  private cdaUrl: string;

  constructor(cdaUrl: string) {
    this.cdaUrl = cdaUrl;
  }

  private transformCdaUser(cdaUser: CdaUser): User {
    const allRoles: string[] = [];
    const allOffices: string[] = [];

    if (cdaUser.roles) {
      for (const [office, roles] of Object.entries(cdaUser.roles)) {
        allOffices.push(office);
        allRoles.push(...roles);
      }
    }

    return {
      id: cdaUser['user-name'],
      username: cdaUser['user-name'],
      email: cdaUser.email || undefined,
      enabled: true,
      offices: [...new Set(allOffices)],
      roles: [...new Set(allRoles)],
    };
  }

  private getHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    return headers;
  }

  async getUsers(authToken?: string): Promise<User[]> {
    try {
      const response = await axios.get<CdaUsersResponse>(`${this.cdaUrl}/users`, {
        headers: this.getHeaders(authToken),
        params: {
          'include-roles': true,
          'page-size': 1000,
        },
      });

      const cdaUsers = response.data.users || [];
      return cdaUsers.map((u) => this.transformCdaUser(u));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch users from CWMS Data API');
      throw new Error('Failed to fetch users');
    }
  }

  async getUser(id: string, authToken?: string): Promise<User | null> {
    try {
      const response = await axios.get<CdaUser>(`${this.cdaUrl}/users/${encodeURIComponent(id)}`, {
        headers: this.getHeaders(authToken),
      });

      if (!response.data || !response.data['user-name']) {
        return null;
      }

      return this.transformCdaUser(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error({ error, id }, 'Failed to fetch user from CWMS Data API');
      throw new Error('Failed to fetch user');
    }
  }

  async getRoles(authToken?: string): Promise<Role[]> {
    try {
      const response = await axios.get<string[]>(`${this.cdaUrl}/roles`, {
        headers: this.getHeaders(authToken),
      });

      return response.data.map((roleName) => ({
        id: roleName,
        name: roleName,
        description: undefined,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch roles from CWMS Data API');
      throw new Error('Failed to fetch roles');
    }
  }

  async getRole(id: string, authToken?: string): Promise<Role | null> {
    try {
      const roles = await this.getRoles(authToken);
      const role = roles.find((r) => r.id === id || r.name === id);
      return role || null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to fetch role from CWMS Data API');
      throw new Error('Failed to fetch role');
    }
  }

  async createUser(): Promise<User> {
    throw new Error('User creation is not supported via CWMS Data API. Use CWMS security procedures directly.');
  }

  async deleteUser(): Promise<void> {
    throw new Error('User deletion is not supported via CWMS Data API. Use CWMS security procedures directly.');
  }

  async createRole(): Promise<Role> {
    throw new Error('Role creation is not supported via CWMS Data API. Use CWMS security procedures directly.');
  }

  async deleteRole(): Promise<void> {
    throw new Error('Role deletion is not supported via CWMS Data API. Use CWMS security procedures directly.');
  }
}
