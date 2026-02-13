import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { decode } from 'jsonwebtoken';

import { getConfig } from '../config';
import { ApiService } from '../services/api.service';
import { OPAService } from '../services/opa.service';
import { AuthorizationContext, AuthorizeRequest, AuthorizeResponse, User } from '../types/authorization';

export class AuthorizationMiddleware {
  private opaService: OPAService;
  private apiService: ApiService;
  private config: ReturnType<typeof getConfig>;
  private whitelistedEndpoints: string[];

  constructor(private fastify: FastifyInstance) {
    this.opaService = new OPAService(fastify);
    this.apiService = new ApiService(fastify);
    this.config = getConfig(fastify);

    // Parse whitelist from config (JSON array string)
    try {
      const parsed = JSON.parse(this.config.OPA_WHITELIST_ENDPOINTS);
      if (Array.isArray(parsed)) {
        this.whitelistedEndpoints = parsed;
      } else {
        throw new Error('OPA_WHITELIST_ENDPOINTS must be a JSON array');
      }
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to parse OPA_WHITELIST_ENDPOINTS, using empty whitelist');
      this.whitelistedEndpoints = [];
    }

    this.fastify.log.info(
      {
        whitelistedEndpoints: this.whitelistedEndpoints,
        count: this.whitelistedEndpoints.length,
      },
      'OPA authorization whitelist configured',
    );
  }

  // Initialize the middleware (database connection, etc.)
  async initialize(): Promise<void> {
    try {
      await this.apiService.initialize();
      this.fastify.log.info('Authorization middleware initialized successfully');
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to initialize authorization middleware');
      throw error;
    }
  }

  // Close resources (API connections, cache, etc.)
  async close(): Promise<void> {
    await this.apiService.close();
  }

  // Check if an endpoint requires OPA authorization based on whitelist
  isWhitelisted(path: string): boolean {
    // Extract the full path without query parameters
    // e.g. /cwms-data/timeseries?name=foo -> /cwms-data/timeseries
    const cleanPath = path.split('?')[0];

    // Check if the path matches any whitelisted endpoint
    return this.whitelistedEndpoints.includes(cleanPath);
  }

  async authorize(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract user from request (database query or JWT token)
      const user = await this.extractUser(request);

      // Build authorization context
      const context: AuthorizationContext = {
        user,
        resource: this.extractResource(request),
        action: this.extractAction(request),
        method: request.method,
        path: request.url,
        query: request.query as Record<string, any>,
        headers: request.headers as Record<string, string>,
        timestamp: new Date(),
        office_id: (request.query as any).office_id || (request.query as any).office,
        data_source: (request.query as any).data_source,
      };

      // Check with OPA
      const decision = await this.opaService.authorize(context);

      if (!decision.allow) {
        this.fastify.log.warn(
          {
            user: user.username,
            resource: context.resource,
            action: context.action,
            reason: decision.reason,
          },
          'Authorization denied',
        );

        reply.code(403).send({
          error: 'Forbidden',
          message: decision.reason || 'You do not have permission to access this resource',
        });

        return;
      }

      // Add authorization headers for the downstream API
      this.addAuthorizationHeaders(request, user, decision);

      this.fastify.log.debug(
        {
          user: user.username,
          authContext: JSON.parse(request.headers['x-cwms-auth-context'] as string),
        },
        'Authorization successful, context header added',
      );
    } catch (error) {
      this.fastify.log.error({ error }, 'Authorization middleware error');
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authorization processing failed',
      });
    }
  }

  async authorizeRequest(authRequest: AuthorizeRequest): Promise<AuthorizeResponse> {
    let user: User;

    if (authRequest.jwt_token) {
      user = await this.extractUserFromToken(authRequest.jwt_token);
    } else if (authRequest.user) {
      user = {
        id: authRequest.user.id || authRequest.user.username || 'unknown',
        username: authRequest.user.username || 'unknown',
        roles: authRequest.user.roles || [],
        offices: authRequest.user.offices || [],
        persona: authRequest.user.persona,
        shift_start: authRequest.user.shift_start,
        shift_end: authRequest.user.shift_end,
        timezone: authRequest.user.timezone,
        authenticated: true,
      };
    } else {
      user = {
        id: 'anonymous',
        username: 'anonymous',
        roles: [],
        offices: [],
        authenticated: false,
      };
    }

    const context: AuthorizationContext = {
      user,
      resource: authRequest.resource,
      action: authRequest.action,
      method: this.actionToMethod(authRequest.action),
      path: `/cwms-data/${authRequest.resource}`,
      timestamp: new Date(),
      office_id: authRequest.context?.office_id,
      data_source: authRequest.context?.data_source,
    };

    const decision = await this.opaService.authorize(context);

    const decisionId = decision.decision_id || `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tsGroupEmbargo = this.buildTsGroupEmbargo(user);

    this.fastify.log.info(
      {
        user: user.username,
        resource: authRequest.resource,
        action: authRequest.action,
        allow: decision.allow,
        decision_id: decisionId,
      },
      'Direct authorization request processed',
    );

    return {
      decision: {
        allow: decision.allow,
        decision_id: decisionId,
        reason: decision.reason,
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        offices: user.offices,
        primary_office: user.primary_office || user.offices?.[0] || 'HQ',
        persona: user.persona,
      },
      constraints: {
        allowed_offices: this.getAllowedOffices(user),
        embargo_rules: decision.constraints?.embargo_rules || this.buildEmbargoRules(user, tsGroupEmbargo),
        embargo_exempt: decision.constraints?.embargo_exempt || this.isEmbargoExempt(user),
        ts_group_embargo: tsGroupEmbargo,
        time_window: decision.constraints?.time_window || this.getTimeWindow(user),
        data_classification: this.getAllowedClassifications(user),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async extractUserFromToken(token: string): Promise<User> {
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      const decoded = decode(cleanToken) as any;

      if (!decoded) {
        throw new Error('Invalid token');
      }

      const username = decoded.preferred_username || decoded.sub;

      if (username) {
        const apiUser = await this.apiService.getUserContext(username, `Bearer ${cleanToken}`);
        if (apiUser) {
          return apiUser;
        }
      }

      return {
        id: decoded.sub || 'unknown',
        username: username || 'unknown',
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
        offices: [],
        authenticated: true,
      };
    } catch (error) {
      this.fastify.log.warn({ error }, 'Failed to extract user from token');
      return {
        id: 'anonymous',
        username: 'anonymous',
        roles: [],
        offices: [],
        authenticated: false,
      };
    }
  }

  private actionToMethod(action: string): string {
    const actionToMethod: Record<string, string> = {
      read: 'GET',
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE',
    };
    return actionToMethod[action] || 'GET';
  }

  private isEmbargoExempt(user: User): boolean {
    const exemptPersonas = ['data_manager', 'water_manager', 'system_admin'];
    const exemptRoles = ['system_admin', 'hec_employee', 'data_manager', 'water_manager'];

    if (user.persona && exemptPersonas.includes(user.persona)) {
      return true;
    }

    return user.roles?.some((role) => exemptRoles.includes(role)) || false;
  }

  private getTimeWindow(user: User): { restrict_hours: number } | null {
    if (user.persona === 'dam_operator') {
      return { restrict_hours: 8 };
    }
    return null;
  }

  private async extractUser(request: FastifyRequest): Promise<User> {
    const headers = request.headers;

    // Check for test/mock user in headers (for development/testing)
    if (headers['x-test-user']) {
      try {
        const testUser = JSON.parse(headers['x-test-user'] as string);

        return {
          id: testUser.id || 'test-user',
          username: testUser.username || 'test-user',
          email: testUser.email,
          roles: testUser.roles || [],
          offices: testUser.offices || [],
          persona: testUser.persona,
          authenticated: true,
        };
      } catch {
        this.fastify.log.warn('Invalid x-test-user header');
      }
    }

    // Extract username from JWT Bearer token
    let username: string | null = null;

    if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
      try {
        const token = headers.authorization.substring(7);
        const decoded = decode(token) as any;

        if (decoded && decoded.preferred_username) {
          username = decoded.preferred_username;
        } else if (decoded && decoded.sub) {
          username = decoded.sub;
        }

        this.fastify.log.debug({ username, token: decoded }, 'Extracted username from JWT token');
      } catch (error) {
        this.fastify.log.warn({ error }, 'Failed to decode JWT token');
      }
    }

    // Query API for user context if we have a username
    if (username) {
      try {
        const bearerToken = headers.authorization;
        const apiUser = await this.apiService.getUserContext(username, bearerToken);

        if (apiUser) {
          this.fastify.log.info(
            {
              username: apiUser.username,
              office: apiUser.offices,
              roles: apiUser.roles,
              persona: apiUser.persona,
            },
            'User context loaded from API',
          );

          return apiUser;
        } else {
          this.fastify.log.warn({ username }, 'User not found in API, using default context');
        }
      } catch (error) {
        this.fastify.log.error({ error, username }, 'Error querying user from API, using default context');
      }
    }

    // Default user for public/unauthenticated access
    return {
      id: 'anonymous',
      username: 'anonymous',
      email: 'anonymous@example.com',
      roles: [],
      offices: [],
      authenticated: false,
    };
  }

  private extractResource(request: FastifyRequest): string {
    // Extract resource from the path, removing query parameters
    // e.g. /cwms-data/timeseries?office=SWT -> timeseries
    const pathWithoutQuery = request.url.split('?')[0];
    const pathParts = pathWithoutQuery.split('/').filter(Boolean);

    if (pathParts.length >= 2 && pathParts[0] === 'cwms-data') {
      return pathParts[1];
    }

    return pathParts[0] || 'unknown';
  }

  private extractAction(request: FastifyRequest): string {
    // Map HTTP method to action
    const methodToAction: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    return methodToAction[request.method] || 'unknown';
  }

  private addAuthorizationHeaders(request: FastifyRequest, user: User, decision: any): void {
    const tsGroupEmbargo = this.buildTsGroupEmbargo(user);

    const authContext = {
      policy: {
        allow: decision.allow,
        decision_id: decision.decision_id || `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        offices: user.offices,
        primary_office: user.primary_office || user.offices?.[0] || 'HQ',
        persona: user.persona,
        ts_privileges: user.ts_privileges,
      },
      constraints: {
        allowed_offices: this.getAllowedOffices(user),
        embargo_rules: decision.constraints?.embargo_rules || this.buildEmbargoRules(user, tsGroupEmbargo),
        embargo_exempt: decision.constraints?.embargo_exempt || this.isEmbargoExempt(user),
        ts_group_embargo: tsGroupEmbargo,
        time_window: decision.constraints?.time_window || this.getTimeWindow(user),
        data_classification: this.getAllowedClassifications(user),
        ...decision.filters,
      },
      context: decision.context || {},
      timestamp: new Date().toISOString(),
    };

    request.headers['x-cwms-auth-context'] = JSON.stringify(authContext);
  }

  private buildTsGroupEmbargo(user: User): Record<string, number> | null {
    if (!user.ts_privileges || user.ts_privileges.length === 0) {
      return null;
    }

    const embargoMap: Record<string, number> = {};
    for (const priv of user.ts_privileges) {
      embargoMap[priv.ts_group_id] = priv.embargo_hours;
    }

    return embargoMap;
  }

  private buildEmbargoRules(
    user: User,
    tsGroupEmbargo: Record<string, number> | null,
  ): Record<string, number> {
    if (this.isEmbargoExempt(user) || !tsGroupEmbargo) {
      return {};
    }

    let maxHours = 0;
    for (const hours of Object.values(tsGroupEmbargo)) {
      if (hours > maxHours) {
        maxHours = hours;
      }
    }

    if (maxHours > 0) {
      return { default: maxHours };
    }

    return {};
  }


  private getAllowedOffices(user: User): string[] {
    if (user.persona === 'automated_processor' || user.roles?.includes('system_admin')) {
      return ['*'];
    }

    return user.offices || [];
  }

  private getAllowedClassifications(user: User): string[] {
    if (user.roles?.includes('system_admin') || user.roles?.includes('hec_employee')) {
      return ['public', 'internal', 'restricted', 'sensitive'];
    }

    if (user.persona === 'data_manager' || user.roles?.includes('water_manager')) {
      return ['public', 'internal', 'restricted', 'sensitive'];
    }

    if (user.authenticated) {
      return ['public', 'internal'];
    }

    return ['public'];
  }
}
