import axios from 'axios';

import { logger } from '../utils/logger.js';
import type { CreateRoleRequest, CreateUserRequest, Role, User } from '../types/index.js';

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

 private parseName(name: string): { firstName: string; lastName: string } {
    const trimmed = name.trim();
    const spaceIndex = trimmed.indexOf(' ');

    if (spaceIndex === -1) {
      return { firstName: trimmed, lastName: '' };
    }

    return {
      firstName: trimmed.substring(0, spaceIndex).trim(),
      lastName: trimmed.substring(spaceIndex + 1).trim(),
    };
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

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const token = await this.getAdminToken();

      const { firstName, lastName } = this.parseName(userData.name);

      const keycloakUser = {
        username: userData.username,
        email: userData.email,
        firstName,
        lastName,
        enabled: userData.enabled ?? true,
        emailVerified: false,
        credentials: [
          {
            type: 'password',
            value: userData.password,
          },
        ],
      };

      const response = await axios.post(`${this.keycloakUrl}/admin/realms/${this.realm}/users`, keycloakUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const locationHeader = response.headers.location || response.headers.Location;

      if (!locationHeader) {
        throw new Error('No location header in response');
      }

      const userId = locationHeader.split('/').pop();

      if (!userId) {
        throw new Error('Failed to extract user ID from location header');
      }

      logger.info({ userId, username: userData.username }, 'User created in Keycloak');

      const createdUser = await this.getUser(userId);

      if (!createdUser) {
        throw new Error('Failed to fetch created user');
      }

      return createdUser;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Username or email already exists');
        }

        if (error.response?.status === 400) {
          throw new Error(error.response.data?.errorMessage || 'Invalid user data');
        }
      }
      logger.error({ error, username: userData.username }, 'Failed to create user in Keycloak');

      throw new Error('Failed to create user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const token = await this.getAdminToken();

      await axios.delete(`${this.keycloakUrl}/admin/realms/${this.realm}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.info({ userId: id }, 'User deleted from Keycloak');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('User not found');
        }
      }
      logger.error({ error, id }, 'Failed to delete user from Keycloak');

      throw new Error('Failed to delete user');
    }
  }
  
   async getRoles(): Promise<Role[]> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const response = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/roles-by-id/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const token = await this.getAdminToken();
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${encodeURIComponent(name)}`,
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

      logger.error({ error, name }, 'Failed to fetch role by name from Keycloak');

      throw new Error('Failed to fetch role');
    }
  }

  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    try {
      const token = await this.getAdminToken();

      const keycloakRole: { name: string; description?: string } = {
        name: roleData.name,
      };

      if (roleData.description && roleData.description.trim() !== '') {
        keycloakRole.description = roleData.description;
      }

      await axios.post(`${this.keycloakUrl}/admin/realms/${this.realm}/roles`, keycloakRole, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.info({ name: roleData.name }, 'Role created in Keycloak');

      const createdRole = await this.getRoleByName(roleData.name);

      if (!createdRole) {
        throw new Error('Failed to fetch created role');
      }

      return createdRole;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Role name already exists');
        }

        if (error.response?.status === 400) {
          throw new Error(error.response.data?.errorMessage || 'Invalid role data');
        }
      }

      logger.error({ error, name: roleData.name }, 'Failed to create role in Keycloak');

      throw new Error('Failed to create role');
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      const token = await this.getAdminToken();

      await axios.delete(`${this.keycloakUrl}/admin/realms/${this.realm}/roles-by-id/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.info({ roleId: id }, 'Role deleted from Keycloak');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Role not found');
        }
      }

      logger.error({ error, id }, 'Failed to delete role from Keycloak');

      throw new Error('Failed to delete role');
    }
  }

}
