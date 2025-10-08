import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AuthorizationContext, User } from '../types/authorization';
import { OPAService } from '../services/opa.service';
import { getConfig } from '../config';

export class AuthorizationMiddleware {
  private opaService: OPAService;
  private config: ReturnType<typeof getConfig>;
  private whitelistedEndpoints: string[];

  constructor(private fastify: FastifyInstance) {
    this.opaService = new OPAService(fastify);
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

    this.fastify.log.info({
      whitelistedEndpoints: this.whitelistedEndpoints,
      count: this.whitelistedEndpoints.length
    }, 'OPA authorization whitelist configured');
  }

  /**
   * Check if an endpoint requires OPA authorization based on whitelist
   */
  isWhitelisted(path: string): boolean {
    // Extract the full path without query parameters
    // e.g., /cwms-data/timeseries?name=foo -> /cwms-data/timeseries
    const cleanPath = path.split('?')[0];

    // Check if the path matches any whitelisted endpoint
    return this.whitelistedEndpoints.includes(cleanPath);
  }

  async authorize(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Extract user from request (mock for now, will integrate with Keycloak later)
      const user = this.extractUser(request);

      // Build authorization context
      const context: AuthorizationContext = {
        user,
        resource: this.extractResource(request),
        action: this.extractAction(request),
        method: request.method,
        path: request.url,
        query: request.query as Record<string, any>,
        headers: request.headers as Record<string, string>,
        timestamp: new Date()
      };

      // Check with OPA
      const decision = await this.opaService.authorize(context);

      if (!decision.allow) {
        this.fastify.log.warn({
          user: user.username,
          resource: context.resource,
          action: context.action,
          reason: decision.reason
        }, 'Authorization denied');

        reply.code(403).send({
          error: 'Forbidden',
          message: decision.reason || 'You do not have permission to access this resource'
        });
        return;
      }

      // Add authorization headers for the downstream API
      this.addAuthorizationHeaders(request, user, decision);

      this.fastify.log.debug({
        user: user.username,
        authContext: JSON.parse(request.headers['x-cwms-auth-context'] as string)
      }, 'Authorization successful, context header added');

    } catch (error) {
      this.fastify.log.error({ error }, 'Authorization middleware error');
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authorization processing failed'
      });
    }
  }

  private extractUser(request: FastifyRequest): User {
    // For now, extract from headers (will integrate with Keycloak JWT later)
    const headers = request.headers;

    // Check for test/mock user in headers
    if (headers['x-test-user']) {
      try {
        const testUser = JSON.parse(headers['x-test-user'] as string);
        return {
          id: testUser.id || 'test-user',
          username: testUser.username || 'test-user',
          email: testUser.email,
          roles: testUser.roles || [],
          offices: testUser.offices || []
        };
      } catch {
        this.fastify.log.warn('Invalid x-test-user header');
      }
    }

    // Default mock user for testing
    return {
      id: 'default-user',
      username: 'default-user',
      email: 'user@example.com',
      roles: ['viewer'],
      offices: ['HQ']
    };
  }

  private extractResource(request: FastifyRequest): string {
    // Extract resource from the path
    // e.g., /cwms-data/timeseries -> timeseries
    const pathParts = request.url.split('/').filter(Boolean);

    if (pathParts.length >= 2 && pathParts[0] === 'cwms-data') {
      return pathParts[1];
    }

    return pathParts[0] || 'unknown';
  }

  private extractAction(request: FastifyRequest): string {
    // Map HTTP method to action
    const methodToAction: Record<string, string> = {
      'GET': 'read',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };

    return methodToAction[request.method] || 'unknown';
  }

  private addAuthorizationHeaders(
    request: FastifyRequest,
    user: User,
    decision: any
  ): void {
    // Build the authorization context object per the latest specification
    const authContext = {
      policy: {
        allow: decision.allow,
        decision_id: decision.decision_id || `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        offices: user.offices,
        primary_office: user.offices?.[0] || 'HQ'
      },
      constraints: decision.filters || {},
      context: decision.context || {},
      timestamp: new Date().toISOString()
    };

    // Set the single authorization context header as JSON string
    // This follows the industry standard pattern from our notes
    request.headers['x-cwms-auth-context'] = JSON.stringify(authContext);
  }
}