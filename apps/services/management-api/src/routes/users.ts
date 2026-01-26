import type { FastifyInstance } from 'fastify';

import type { KeycloakService } from '../services/keycloak.service.js';
import { logger } from '../utils/logger.js';
import { createUserSchema, validateRequest } from '../middleware/validation.js';
import type { CreateUserRequest } from '../types/index.js';

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

  fastify.post(
    '/users',
    {
      preHandler: validateRequest(createUserSchema),
    },
    async (request, reply) => {
      try {
        const userData = request.body as CreateUserRequest;
        const user = await keycloakService.createUser(userData);

        logger.info({ userId: user.id, username: user.username }, 'User created successfully');

        return reply.status(201).send({
          success: true,
          data: user,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to create user');

        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return reply.status(409).send({
              success: false,
              error: error.message,
            });
          }

          if (error.message.includes('Invalid user data')) {
            return reply.status(400).send({
              success: false,
              error: error.message,
            });
          }
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
      const { id } = request.params as { id: string };

      await keycloakService.deleteUser(id);

      logger.info({ userId: id }, 'User deleted successfully');

      return reply.send({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete user');

      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete user',
      });
    }
  });
}
