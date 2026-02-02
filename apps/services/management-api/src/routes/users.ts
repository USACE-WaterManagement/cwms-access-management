import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { CdaService } from '../services/cda.service.js';
import { logger } from '../utils/logger.js';
import { createUserSchema, validateRequest } from '../middleware/validation.js';

function extractAuthToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

export async function usersRoutes(
  fastify: FastifyInstance,
  cdaService: CdaService,
) {
  fastify.get('/users', async (request, reply) => {
    try {
      const authToken = extractAuthToken(request);
      const users = await cdaService.getUsers(authToken);

      return reply.send({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get users');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  });

  fastify.get('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const authToken = extractAuthToken(request);
      const user = await cdaService.getUser(id, authToken);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
        });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get user');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch user',
      });
    }
  });

  fastify.post(
    '/users',
    {
      preHandler: validateRequest(createUserSchema),
    },
    async (request, reply) => {
      try {
        await cdaService.createUser();
        return reply.status(501).send({
          success: false,
          error: 'User creation is not supported via CWMS Data API',
        });
      } catch (error) {
        logger.error({ error }, 'Failed to create user');

        if (error instanceof Error && error.message.includes('not supported')) {
          return reply.status(501).send({
            success: false,
            error: error.message,
          });
        }

        return reply.status(500).send({
          success: false,
          error: 'Failed to create user',
        });
      }
    },
  );

  fastify.delete('/users/:id', async (request, reply) => {
    try {
      await cdaService.deleteUser();
      return reply.status(501).send({
        success: false,
        error: 'User deletion is not supported via CWMS Data API',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete user');

      if (error instanceof Error && error.message.includes('not supported')) {
        return reply.status(501).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete user',
      });
    }
  });
}
