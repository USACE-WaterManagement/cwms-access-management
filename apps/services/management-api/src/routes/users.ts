import type { FastifyInstance } from 'fastify';

import type { KeycloakService } from '../services/keycloak.service.js';
import { logger } from '../utils/logger.js';

export async function usersRoutes(
  fastify: FastifyInstance,
  keycloakService: KeycloakService,
) {
  fastify.get('/users', async (request, reply) => {
    try {
      const users = await keycloakService.getUsers();

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
      const user = await keycloakService.getUser(id);

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
}
