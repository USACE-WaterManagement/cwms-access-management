export interface TsGroupPrivilege {
  ts_group_code: number;
  ts_group_id: string;
  privilege: 'read' | 'write' | 'read-write' | 'none';
  embargo_hours: number;
}

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
  ts_privileges?: TsGroupPrivilege[];
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
  office_id?: string;
  data_source?: string;
}

export interface AuthorizationDecision {
  allow: boolean;
  reason?: string;
  decision_id?: string;
  filters?: DataFilter[];
  context?: Record<string, any>;
  constraints?: {
    embargo_rules?: Record<string, number>;
    embargo_exempt?: boolean;
    time_window?: { restrict_hours: number };
  };
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

export interface AuthorizeRequest {
  user?: {
    id?: string;
    username?: string;
    roles?: string[];
    offices?: string[];
    persona?: string;
    shift_start?: number;
    shift_end?: number;
    timezone?: string;
  };
  resource: string;
  action: string;
  context?: {
    office_id?: string;
    data_source?: string;
    created_ns?: number;
    timestamp_ns?: number;
    [key: string]: any;
  };
  jwt_token?: string;
}

export interface AuthorizeResponse {
  decision: {
    allow: boolean;
    decision_id: string;
    reason?: string;
  };
  user: {
    id: string;
    username: string;
    email?: string;
    roles: string[];
    offices: string[];
    primary_office?: string;
    persona?: string;
  };
  constraints: {
    allowed_offices: string[];
    embargo_rules?: Record<string, number> | null;
    embargo_exempt: boolean;
    ts_group_embargo?: Record<string, number> | null;
    time_window?: { restrict_hours: number } | null;
    data_classification: string[];
  };
  timestamp: string;
}
