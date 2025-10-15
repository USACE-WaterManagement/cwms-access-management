import axios from 'axios';

import { logger } from '../utils/logger.js';
import type { Role, User } from '../types/index.js';

export class KeycloakService {
  private keycloakUrl: string;
  private realm: string;

  constructor(keycloakUrl: string, realm: string = 'cwms') {
    this.keycloakUrl = keycloakUrl;
    this.realm = realm;
  }

  private async getAdminToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
          grant_type: 'password',
          client_id: 'admin-cli',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      logger.error({ error }, 'Failed to get Keycloak admin token');

      throw new Error('Failed to authenticate with Keycloak');
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch users from Keycloak');

      throw new Error('Failed to fetch users');
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const user = response.data;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error({ error, id }, 'Failed to fetch user from Keycloak');

      throw new Error('Failed to fetch user');
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch roles from Keycloak');

      throw new Error('Failed to fetch roles');
    }
  }

  async getRole(id: string): Promise<Role | null> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/roles-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const role = response.data;

      return {
        id: role.id,
        name: role.name,
        description: role.description,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error({ error, id }, 'Failed to fetch role from Keycloak');

      throw new Error('Failed to fetch role');
    }
  }
}
