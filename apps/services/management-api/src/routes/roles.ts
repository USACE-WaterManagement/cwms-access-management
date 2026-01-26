import type { FastifyInstance } from 'fastify';

import type { KeycloakService } from '../services/keycloak.service.js';
import { createRoleSchema, validateRequest } from '../middleware/validation.js';
import type { CreateRoleRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function rolesRoutes(fastify: FastifyInstance, keycloakService: KeycloakService) {
  fastify.get('/roles', async (request, reply) => {
    try {
      const roles = await keycloakService.getRoles();

      return reply.send({
        success: true,
        data: roles,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get roles');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch roles',
      });
    }
  });

  fastify.get('/roles/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const role = await keycloakService.getRole(id);

      if (!role) {
        return reply.status(404).send({
          success: false,
          error: 'Role not found',
        });
      }

      return reply.send({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get role');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch role',
      });
    }
  });

  fastify.post(
    '/roles',
    {
      preHandler: validateRequest(createRoleSchema),
    },
    async (request, reply) => {
      try {
        const roleData = request.body as CreateRoleRequest;
        const role = await keycloakService.createRole(roleData);

        logger.info({ roleId: role.id, name: role.name }, 'Role created successfully');

        return reply.status(201).send({
          success: true,
          data: role,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to create role');

        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return reply.status(409).send({
              success: false,
              error: error.message,
            });
          }

          if (error.message.includes('Invalid role data')) {
            return reply.status(400).send({
              success: false,
              error: error.message,
            });
          }
        }

        return reply.status(500).send({
          success: false,
          error: 'Failed to create role',
        });
      }
    },
  );

  fastify.delete('/roles/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await keycloakService.deleteRole(id);

      logger.info({ roleId: id }, 'Role deleted successfully');

      return reply.send({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete role');

      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: 'Role not found',
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete role',
      });
    }
  });
}
