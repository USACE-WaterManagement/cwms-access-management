import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
// Temporarily disabled due to ESM compatibility issues
// import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CWMS Authorizer Proxy API',
        description: 'Transparent authorization proxy for CWMS Data API with OPA-based policy enforcement',
        version: '1.0.0',
        contact: {
          name: 'CWMS Access Management Team',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
        {
          url: 'http://authorizer-proxy:3001',
          description: 'Docker/Container environment',
        },
      ],
      components: {
        securitySchemes: {
          testUser: {
            type: 'apiKey',
            in: 'header',
            name: 'x-test-user',
            description: 'Test user context for development (JSON object)',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token for authentication',
          },
        },
        schemas: {
          HealthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
                example: 'healthy',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-09-29T10:00:00.000Z',
              },
              service: {
                type: 'string',
                example: 'authorizer-proxy',
              },
            },
            required: ['status', 'timestamp', 'service'],
          },
          ReadyResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['ready', 'not-ready'],
                example: 'ready',
              },
              downstream: {
                type: 'string',
                enum: ['available', 'unavailable'],
                example: 'available',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-09-29T10:00:00.000Z',
              },
            },
            required: ['status', 'downstream', 'timestamp'],
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Forbidden',
              },
              message: {
                type: 'string',
                example: 'You do not have permission to access this resource',
              },
            },
            required: ['error', 'message'],
          },
          AuthContext: {
            type: 'object',
            properties: {
              policy: {
                type: 'object',
                properties: {
                  allow: {
                    type: 'boolean',
                    example: true,
                  },
                  decision_id: {
                    type: 'string',
                    example: 'proxy-1759138056211-4bd7dul0f',
                  },
                },
                required: ['allow', 'decision_id'],
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'user-123',
                  },
                  username: {
                    type: 'string',
                    example: 'john.doe',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john.doe@usace.mil',
                  },
                  roles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['water_manager', 'data_manager'],
                  },
                  offices: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['SPK', 'SWT'],
                  },
                  primary_office: {
                    type: 'string',
                    example: 'SPK',
                  },
                },
                required: ['id', 'username', 'roles', 'offices', 'primary_office'],
              },
              constraints: {
                type: 'object',
                additionalProperties: true,
                example: {},
              },
              context: {
                type: 'object',
                additionalProperties: true,
                example: {},
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-09-29T10:00:00.000Z',
              },
            },
            required: ['policy', 'user', 'constraints', 'context', 'timestamp'],
          },
        },
      },
      tags: [
        {
          name: 'Health',
          description: 'Health check endpoints',
        },
        {
          name: 'Proxy',
          description: 'CWMS Data API proxy endpoints',
        },
      ],
    },
  });

  // Temporarily disabled due to ESM compatibility issues with swagger-ui
  // The OpenAPI spec is still available at /documentation/json
  // await fastify.register(fastifySwaggerUi, {
  //   routePrefix: '/documentation'
  // });

  // Health, ready, and proxy endpoints are already defined in server.ts
  // The OpenAPI spec above documents them automatically
}
