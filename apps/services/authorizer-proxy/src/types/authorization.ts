export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  offices: string[];
  primary_office?: string;
  persona?: string;
  region?: string;
  timezone?: string;
  shift_start?: number;
  shift_end?: number;
  authenticated?: boolean;
  auth_method?: string;
  allowed_parameters?: string[];
  partnership_expiry?: string;
  attributes?: Record<string, any>;
}

export interface AuthorizationContext {
  user: User;
  resource: string;
  action: string;
  method: string;
  path: string;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  timestamp: Date;
}

export interface AuthorizationDecision {
  allow: boolean;
  reason?: string;
  filters?: DataFilter[];
  context?: Record<string, any>;
}

export interface DataFilter {
  type: 'office' | 'embargo' | 'time_range' | 'custom';
  field: string;
  operator: 'equals' | 'in' | 'not_in' | 'between' | 'greater_than' | 'less_than';
  value: any;
}

export interface OPARequest {
  input: {
    user: User;
    resource: string;
    action: string;
    context: Record<string, any>;
  };
}

export interface OPAResponse {
  result: {
    allow: boolean;
    filters?: DataFilter[];
    headers?: Record<string, string>;
    reason?: string;
  };
}
