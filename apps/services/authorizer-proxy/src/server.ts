import fastifyCors from '@fastify/cors';
import fastifyHttpProxy from '@fastify/http-proxy';
import Fastify from 'fastify';

import { getConfig, registerConfig } from './config';
import { AuthorizationMiddleware } from './middleware/authorization';
import { registerSwagger } from './plugins/swagger';
import { AuthorizeRequest } from './types/authorization';
import {
  getMetrics,
  getMetricsJson,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  authorizationDecisionsTotal,
} from './services/metrics.service';

async function buildServer() {
  // Create Fastify instance with built-in logger
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    trustProxy: true,
  });

  // Register configuration
  await registerConfig(fastify);
  const config = getConfig(fastify);

  // Register Swagger/OpenAPI documentation
  await registerSwagger(fastify);

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins for now, configure as needed
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Create authorization middleware instance
  const authMiddleware = new AuthorizationMiddleware(fastify);

  // Initialize middleware (database connection, etc.)
  await authMiddleware.initialize();

  // Register shutdown hook
  fastify.addHook('onClose', async () => {
    await authMiddleware.close();
  });

  // Request metrics tracking
  fastify.addHook('onRequest', async () => {
    activeConnections.inc();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    activeConnections.dec();

    // Skip metrics for the metrics endpoint itself
    if (request.url === '/metrics' || request.url === '/metrics/json') {
      return;
    }

    const route = request.url.split('?')[0];
    const labels = {
      method: request.method,
      route: route.length > 50 ? route.substring(0, 50) : route,
      status_code: reply.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
  });

  // Health check endpoint (no auth required)
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'authorizer-proxy',
    };
  });

  // Ready check endpoint
  fastify.get('/ready', async () => {
    // Check if we can reach the downstream API
    try {
      const response = await fetch(`${config.CWMS_API_URL}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      return {
        status: 'ready',
        downstream: response.ok ? 'available' : 'unavailable',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'not-ready',
        downstream: 'unavailable',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Prometheus metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return getMetrics();
  });

  // JSON metrics endpoint for easier parsing in scripts
  fastify.get('/metrics/json', async () => {
    return getMetricsJson();
  });

  // Authorization endpoint for external services
  fastify.post<{ Body: AuthorizeRequest }>('/authorize', {
    schema: {
      description: 'Get authorization decision for a resource and action',
      tags: ['authorization'],
      body: {
        type: 'object',
        required: ['resource', 'action'],
        properties: {
          user: {
            type: 'object',
            description: 'User context (if not using jwt_token)',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              roles: { type: 'array', items: { type: 'string' } },
              offices: { type: 'array', items: { type: 'string' } },
              persona: { type: 'string' },
              shift_start: { type: 'number' },
              shift_end: { type: 'number' },
              timezone: { type: 'string' },
            },
          },
          resource: {
            type: 'string',
            description: 'Resource being accessed (e.g., timeseries, locations)',
          },
          action: {
            type: 'string',
            enum: ['read', 'create', 'update', 'delete'],
            description: 'Action being performed',
          },
          context: {
            type: 'object',
            description: 'Additional context for authorization',
            properties: {
              office_id: { type: 'string' },
              data_source: { type: 'string' },
              created_ns: { type: 'number' },
              timestamp_ns: { type: 'number' },
            },
            additionalProperties: true,
          },
          jwt_token: {
            type: 'string',
            description: 'JWT token for user authentication (alternative to user object)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            decision: {
              type: 'object',
              properties: {
                allow: { type: 'boolean' },
                decision_id: { type: 'string' },
                reason: { type: 'string' },
              },
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                roles: { type: 'array', items: { type: 'string' } },
                offices: { type: 'array', items: { type: 'string' } },
                primary_office: { type: 'string' },
                persona: { type: 'string' },
              },
            },
            constraints: {
              type: 'object',
              additionalProperties: true,
              properties: {
                allowed_offices: { type: 'array', items: { type: 'string' } },
                embargo_rules: { type: 'object', additionalProperties: true },
                embargo_exempt: { type: 'boolean' },
                ts_group_embargo: { type: 'object', additionalProperties: true },
                time_window: { type: 'object', additionalProperties: true },
                data_classification: { type: 'array', items: { type: 'string' } },
              },
            },
            timestamp: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authRequest = request.body;

        if (!authRequest.resource || !authRequest.action) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'resource and action are required fields',
          });
        }

        const validActions = ['read', 'create', 'update', 'delete'];
        if (!validActions.includes(authRequest.action)) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: `action must be one of: ${validActions.join(', ')}`,
          });
        }

        const result = await authMiddleware.authorizeRequest(authRequest);
        authorizationDecisionsTotal.inc({
          decision: result.decision.allow ? 'allow' : 'deny',
          resource: authRequest.resource,
        });
        return reply.send(result);
      } catch (error) {
        fastify.log.error({ error }, 'Authorization endpoint error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Authorization processing failed',
        });
      }
    },
  });

  // Register the transparent proxy for /cwms-data/* routes
  await fastify.register(fastifyHttpProxy, {
    upstream: config.CWMS_API_URL,
    prefix: '/cwms-data',

    // Pre-handler for authorization
    preHandler: async (request, reply) => {
      // Skip authorization for health checks
      if (request.url === '/cwms-data/health' || request.url === '/cwms-data/') {
        return;
      }

      // Skip other endpoints that shouldn't be authorized
      if (request.url.startsWith('/cwms-data/docs') || request.url.startsWith('/cwms-data/swagger')) {
        return;
      }

      // Check if endpoint requires OPA authorization (whitelist pattern)
      if (!authMiddleware.isWhitelisted(request.url)) {
        fastify.log.debug(
          {
            url: request.url,
            method: request.method,
          },
          'Endpoint not in OPA whitelist - bypassing authorization',
        );

        return;
      }

      // Run authorization middleware for whitelisted endpoints
      fastify.log.debug(
        {
          url: request.url,
          method: request.method,
        },
        'Endpoint in OPA whitelist - running authorization',
      );

      await authMiddleware.authorize(request, reply);

      // Log the request being proxied
      fastify.log.debug(
        {
          method: request.method,
          url: request.url,
          headers: request.headers,
        },
        'Proxying request to CWMS API',
      );
    },

    // Reply options
    replyOptions: {
      onError: (reply, error) => {
        fastify.log.error({ error }, 'Proxy error occurred');
        reply.code(502).send({
          error: 'Bad Gateway',
          message: 'Unable to reach downstream service',
        });
      },
    },
  });

  // Catch-all route for non-cwms-data paths (exclude OPTIONS handled by CORS)
  fastify.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/*',
    handler: async (request, reply) => {
      reply.code(404).send({
        error: 'Not Found',
        message: 'This proxy only handles /cwms-data/* routes',
      });
    },
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ error, request: { method: request.method, url: request.url } }, 'Unhandled error');

    reply.code(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildServer();
    const config = getConfig(fastify);

    await fastify.listen({
      port: parseInt(config.PORT),
      host: config.HOST,
    });

    fastify.log.info(`Authorizer Proxy started on ${config.HOST}:${config.PORT}`);
    fastify.log.info(`Proxying to CWMS API at ${config.CWMS_API_URL}`);

    if (config.BYPASS_AUTH === 'true') {
      fastify.log.warn('BYPASS_AUTH is enabled - authorization checks may be skipped!');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
