import { FastifyInstance } from 'fastify';

import { getConfig } from '../config';
import { User } from '../types/authorization';
import { CacheService } from './cache.service';

interface CwmsApiUser {
  'user-name': string;
  principal: string;
  email: string;
  'cac-auth'?: boolean;
  roles?: Record<string, string[]>;
}

export class ApiService {
  private cacheService: CacheService;
  private config: ReturnType<typeof getConfig>;
  private apiBaseUrl: string;

  constructor(private fastify: FastifyInstance) {
    this.config = getConfig(fastify);
    this.cacheService = new CacheService(fastify);
    this.apiBaseUrl = this.config.CWMS_API_URL;
  }

  async initialize(): Promise<void> {
    try {
      this.fastify.log.info('Initializing API service');
      await this.cacheService.initialize();
      this.fastify.log.info('API service initialized successfully');
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to initialize API service or Redis cache');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.cacheService.close();
  }

  async getUserContext(username: string, bearerToken?: string): Promise<User | null> {
    const cached = await this.cacheService.getUserContext(username);
    if (cached) {
      this.fastify.log.info({ username, source: 'cache' }, 'User context loaded from cache');
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (bearerToken) {
        headers.Authorization = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
      } else if (this.config.CWMS_API_KEY) {
        headers.Authorization = this.config.CWMS_API_KEY.startsWith('apikey ')
          ? this.config.CWMS_API_KEY
          : `apikey ${this.config.CWMS_API_KEY}`;
      }

      const endpoint = bearerToken
        ? `${this.apiBaseUrl}/user/profile`
        : `${this.apiBaseUrl}/users/${username}?include-roles=true`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(parseInt(this.config.CWMS_API_TIMEOUT)),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.fastify.log.warn({ username, status: response.status }, 'User not authenticated');
          return null;
        }

        if (response.status === 404) {
          this.fastify.log.warn({ username }, 'User not found in CWMS system');
          return null;
        }

        const errorText = await response.text();
        this.fastify.log.error(
          { username, status: response.status, error: errorText },
          'Failed to fetch user context from API',
        );
        return null;
      }

      const apiUser: CwmsApiUser = await response.json();

      const allRoles: string[] = [];
      const offices: string[] = [];

      if (apiUser.roles) {
        for (const [office, roleList] of Object.entries(apiUser.roles)) {
          offices.push(office);
          allRoles.push(...roleList);
        }
      }

      const primaryOffice = offices.length > 0 ? offices[0] : undefined;

      const user: User = {
        id: apiUser['user-name'],
        username: apiUser['user-name'],
        email: apiUser.email || `${apiUser['user-name'].toLowerCase()}@usace.mil`,
        roles: Array.from(new Set(allRoles)),
        offices: Array.from(new Set(offices)),
        primary_office: primaryOffice,
        authenticated: true,
      };

      this.fastify.log.debug(
        {
          username,
          offices: user.offices,
          roles: user.roles,
          roleCount: user.roles.length,
        },
        'User context retrieved from API',
      );

      await this.cacheService.setUserContext(username, user);

      return user;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.fastify.log.error({ username }, 'API request timeout');
      } else {
        this.fastify.log.error({ error, username }, 'Error querying user context from API');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      this.fastify.log.error({ error }, 'API health check failed');
      return false;
    }
  }
}
