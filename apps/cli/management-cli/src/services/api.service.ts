import axios, { AxiosInstance } from 'axios';

import type { CreateUserInput } from '../utils/validation';
import { logger } from '../utils/logger';
import { getConfig } from '../utils/config';

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const config = getConfig();

    this.baseUrl = baseUrl || config.apiUrl || process.env.MANAGEMENT_API_URL || 'http://localhost:3002';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });

    this.client.interceptors.request.use((config) => {
      const storedConfig = getConfig();

      if (storedConfig.token) {
        config.headers.Authorization = `Bearer ${storedConfig.token}`;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logger.error('Authentication required. Please run: cwms-admin login');
          throw new Error('Not authenticated. Please run: cwms-admin login');
        }
        logger.error({ error }, 'API request failed');
        throw error;
      },
    );
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await this.client.get<ApiResponse<User[]>>('/users');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch users');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get users');
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const response = await this.client.get<ApiResponse<User>>(`/users/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch user');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error, id }, 'Failed to get user');
      throw error;
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      const response = await this.client.get<ApiResponse<Role[]>>('/roles');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch roles');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get roles');
      throw error;
    }
  }

  async getRole(id: string): Promise<Role> {
    try {
      const response = await this.client.get<ApiResponse<Role>>(`/roles/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch role');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error, id }, 'Failed to get role');
      throw error;
    }
  }

  async getPolicies(): Promise<Policy[]> {
    try {
      const response = await this.client.get<ApiResponse<Policy[]>>('/policies');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch policies');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get policies');
      throw error;
    }
  }

  async getPolicy(id: string): Promise<Policy> {
    try {
      const response = await this.client.get<ApiResponse<Policy>>(`/policies/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch policy');
      }

      return response.data.data;
    } catch (error) {
      logger.error({ error, id }, 'Failed to get policy');
      throw error;
    }
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const response = await this.client.post<ApiResponse<User>>('/users', userData);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to create user');
      }

      logger.debug(
        { userId: response.data.data.id, username: response.data.data.username },
        'User created successfully',
      );

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Username or email already exists');
        }

        if (error.response?.status === 400) {
          const details = error.response.data?.details;

          if (details && Array.isArray(details)) {
            const messages = details.map((d: any) => `${d.field}: ${d.message}`).join(', ');

            throw new Error(`Validation error: ${messages}`);
          }

          throw new Error(error.response.data?.error || 'Invalid user data');
        }
      }

      logger.error({ error, username: userData.username }, 'Failed to create user');

      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/users/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete user');
      }

      logger.debug({ userId: id }, 'User deleted successfully');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('User not found');
        }
      }

      logger.error({ error, id }, 'Failed to delete user');

      throw error;
    }
  }
}
