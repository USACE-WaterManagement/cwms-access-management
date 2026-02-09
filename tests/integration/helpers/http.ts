import { config } from '../setup/config.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
  timeout?: number;
}

export interface TestResponse {
  status: number;
  statusText: string;
  headers: Headers;
  data: unknown;
  ok: boolean;
}

export async function proxyRequest(
  path: string,
  options: RequestOptions = {}
): Promise<TestResponse> {
  return makeRequest(`${config.proxy.url}${path}`, options);
}

export async function directApiRequest(
  path: string,
  options: RequestOptions = {}
): Promise<TestResponse> {
  return makeRequest(`${config.api.url}${path}`, options);
}

export async function opaRequest(
  path: string,
  options: RequestOptions = {}
): Promise<TestResponse> {
  return makeRequest(`${config.opa.url}${path}`, options);
}

export async function managementApiRequest(
  path: string,
  options: RequestOptions = {}
): Promise<TestResponse> {
  return makeRequest(`${config.managementApi.url}${path}`, options);
}

async function makeRequest(url: string, options: RequestOptions = {}): Promise<TestResponse> {
  const { method = 'GET', headers = {}, body, token, timeout = config.timeouts.request } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
      ok: response.ok,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function hasAuthContextHeader(response: TestResponse): boolean {
  return response.headers.has('x-cwms-auth-context');
}

export function getAuthContextHeader(response: TestResponse): unknown | null {
  const header = response.headers.get('x-cwms-auth-context');
  if (!header) return null;
  try {
    return JSON.parse(header);
  } catch {
    return null;
  }
}
