import type { FastifyInstance } from 'fastify';

import type { CdaService } from '../services/cda.service.js';
import { extractAuthToken } from '../utils/auth.utils.js';
import { logger } from '../utils/logger.js';

export async function rolesRoutes(fastify: FastifyInstance, cdaService: CdaService) {
  fastify.get('/roles', async (request, reply) => {
    try {
      const authToken = extractAuthToken(request);
      const roles = await cdaService.getRoles(authToken);

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
      const authToken = extractAuthToken(request);
      const role = await cdaService.getRole(id, authToken);

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

  fastify.post('/roles', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'Role creation is not supported via CWMS Data API. Use CWMS security procedures directly.',
    });
  });

  fastify.delete('/roles/:id', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'Role deletion is not supported via CWMS Data API. Use CWMS security procedures directly.',
    });
  });
}
