import type { FastifyInstance } from 'fastify';

import type { CdaService } from '../services/cda.service.js';
import { extractAuthToken } from '../utils/auth.utils.js';
import { logger } from '../utils/logger.js';

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

  fastify.post('/users', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'User creation is not supported via CWMS Data API. Use CWMS security procedures directly.',
    });
  });

  fastify.delete('/users/:id', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'User deletion is not supported via CWMS Data API. Use CWMS security procedures directly.',
    });
  });
}
