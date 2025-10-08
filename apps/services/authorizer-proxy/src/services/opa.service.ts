import axios, { AxiosInstance } from 'axios';
import { FastifyInstance } from 'fastify';
import {
  AuthorizationContext,
  AuthorizationDecision,
  OPARequest,
  OPAResponse
} from '../types/authorization';
import { getConfig } from '../config';

export class OPAService {
  private client: AxiosInstance;
  private policyPath: string;
  private cache: Map<string, { decision: AuthorizationDecision; timestamp: number }>;
  private cacheTTL: number;

  constructor(private fastify: FastifyInstance) {
    const config = getConfig(fastify);

    this.client = axios.create({
      baseURL: config.OPA_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.policyPath = config.OPA_POLICY_PATH;
    this.cache = new Map();
    this.cacheTTL = parseInt(config.CACHE_TTL_SECONDS) * 1000;

    // Clear expired cache entries periodically
    setInterval(() => this.clearExpiredCache(), 60000);
  }

  async authorize(context: AuthorizationContext): Promise<AuthorizationDecision> {
    const cacheKey = this.generateCacheKey(context);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.fastify.log.debug({ cacheKey }, 'Using cached authorization decision');
      return cached.decision;
    }

    try {
      // Build OPA request
      const opaRequest: OPARequest = {
        input: {
          user: context.user,
          resource: context.resource,
          action: context.action,
          context: {
            method: context.method,
            path: context.path,
            query: context.query || {},
            timestamp: context.timestamp.toISOString()
          }
        }
      };

      this.fastify.log.debug({ opaRequest }, 'Sending request to OPA');

      // Call OPA
      const response = await this.client.post<OPAResponse>(
        this.policyPath,
        opaRequest
      );

      // OPA returns result as boolean directly or as an object with allow property
      const result = response.data.result;
      const decision: AuthorizationDecision = {
        allow: typeof result === 'boolean' ? result : (result?.allow || false),
        reason: typeof result === 'object' ? result?.reason : undefined,
        filters: typeof result === 'object' ? result?.filters : undefined,
        context: typeof result === 'object' ? result?.headers : undefined
      };

      // Cache the decision
      this.cache.set(cacheKey, {
        decision,
        timestamp: Date.now()
      });

      this.fastify.log.info({
        user: context.user.username,
        resource: context.resource,
        action: context.action,
        allow: decision.allow
      }, 'Authorization decision made');

      return decision;

    } catch (error) {
      this.fastify.log.error({ error, context }, 'OPA authorization failed');

      // In case of OPA failure, we can either:
      // 1. Deny access (secure by default)
      // 2. Allow access with warning (if BYPASS_AUTH is true)
      const config = getConfig(this.fastify);

      if (config.BYPASS_AUTH === 'true') {
        this.fastify.log.warn('Bypassing authorization due to OPA failure and BYPASS_AUTH=true');
        return { allow: true, reason: 'OPA unavailable, bypassed' };
      }

      return {
        allow: false,
        reason: 'Authorization service unavailable'
      };
    }
  }

  private generateCacheKey(context: AuthorizationContext): string {
    return `${context.user.id}:${context.resource}:${context.action}:${context.path}`;
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.fastify.log.debug({ cleared }, 'Cleared expired cache entries');
    }
  }

  // Mock authorization for testing when OPA is not available
  async mockAuthorize(context: AuthorizationContext): Promise<AuthorizationDecision> {
    this.fastify.log.warn('Using mock authorization - for testing only');

    // Simple mock rules for testing
    const publicPaths = ['/health', '/metrics', '/offices'];
    const isPublic = publicPaths.some(path => context.path.includes(path));

    if (isPublic) {
      return { allow: true, reason: 'Public endpoint' };
    }

    // Check if user has any roles
    if (!context.user.roles || context.user.roles.length === 0) {
      return { allow: false, reason: 'No roles assigned' };
    }

    // For testing: allow if user has offices
    if (context.user.offices && context.user.offices.length > 0) {
      return {
        allow: true,
        reason: 'User has office access',
        filters: [{
          type: 'office',
          field: 'office_id',
          operator: 'in',
          value: context.user.offices
        }]
      };
    }

    return { allow: false, reason: 'Insufficient permissions' };
  }
}