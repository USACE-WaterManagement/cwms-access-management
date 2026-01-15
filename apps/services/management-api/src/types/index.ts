export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  offices?: string[];
  roles?: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  rules: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}
