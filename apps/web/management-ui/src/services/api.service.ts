import axios, { AxiosInstance } from 'axios';

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

class ApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        console.error('API request failed:', error);
        throw error;
      },
    );
  }

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<ApiResponse<User[]>>('/users');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch users');
    }

    return response.data.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>(`/users/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch user');
    }

    return response.data.data;
  }

  async getRoles(): Promise<Role[]> {
    const response = await this.client.get<ApiResponse<Role[]>>('/roles');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch roles');
    }

    return response.data.data;
  }

  async getRole(id: string): Promise<Role> {
    const response = await this.client.get<ApiResponse<Role>>(`/roles/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch role');
    }

    return response.data.data;
  }

  async getPolicies(): Promise<Policy[]> {
    const response = await this.client.get<ApiResponse<Policy[]>>('/policies');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch policies');
    }

    return response.data.data;
  }

  async getPolicy(id: string): Promise<Policy> {
    const response = await this.client.get<ApiResponse<Policy>>(`/policies/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch policy');
    }

    return response.data.data;
  }
}

export const apiService = new ApiService();
