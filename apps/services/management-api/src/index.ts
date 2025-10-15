import Fastify from 'fastify';
import cors from '@fastify/cors';
import pino from 'pino';

import { KeycloakService } from './services/keycloak.service.js';
import { OpaService } from './services/opa.service.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { rolesRoutes } from './routes/roles.js';
import { policiesRoutes } from './routes/policies.js';

const PORT = parseInt(process.env.MANAGEMENT_API_PORT || '3002', 10);
const HOST = process.env.MANAGEMENT_API_HOST || '0.0.0.0';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080/auth';
const OPA_URL = process.env.OPA_URL || 'http://localhost:8181';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = pino({ level: LOG_LEVEL });

async function start() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  const keycloakService = new KeycloakService(KEYCLOAK_URL);
  const opaService = new OpaService(OPA_URL);

  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await authRoutes(fastify);

  fastify.addHook('onRequest', async (request, reply) => {
    if (
      request.url === '/health' ||
      request.url === '/login' ||
      request.method === 'OPTIONS'
    ) {
      return;
    }

    await authMiddleware(request, reply);
  });

  await usersRoutes(fastify, keycloakService);
  await rolesRoutes(fastify, keycloakService);
  await policiesRoutes(fastify, opaService);

  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(
      `Management API running on http://${HOST}:${PORT}`,
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start Management API');
    process.exit(1);
  }
}

start();
