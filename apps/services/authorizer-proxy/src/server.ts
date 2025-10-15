import fastifyCors from '@fastify/cors';
import fastifyHttpProxy from '@fastify/http-proxy';
import Fastify from 'fastify';

import { getConfig, registerConfig } from './config';
import { AuthorizationMiddleware } from './middleware/authorization';
import { registerSwagger } from './plugins/swagger';

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
