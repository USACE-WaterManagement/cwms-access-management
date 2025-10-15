import type { FastifyInstance } from 'fastify';

import type { KeycloakService } from '../services/keycloak.service.js';
import { logger } from '../utils/logger.js';

export async function rolesRoutes(
  fastify: FastifyInstance,
  keycloakService: KeycloakService,
) {
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
}
