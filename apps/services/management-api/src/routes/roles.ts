import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { CdaService } from '../services/cda.service.js';
import { createRoleSchema, validateRequest } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

function extractAuthToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

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

  fastify.post(
    '/roles',
    {
      preHandler: validateRequest(createRoleSchema),
    },
    async (request, reply) => {
      try {
        await cdaService.createRole();
        return reply.status(501).send({
          success: false,
          error: 'Role creation is not supported via CWMS Data API',
        });
      } catch (error) {
        logger.error({ error }, 'Failed to create role');

        if (error instanceof Error && error.message.includes('not supported')) {
          return reply.status(501).send({
            success: false,
            error: error.message,
          });
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
      await cdaService.deleteRole();
      return reply.status(501).send({
        success: false,
        error: 'Role deletion is not supported via CWMS Data API',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete role');

      if (error instanceof Error && error.message.includes('not supported')) {
        return reply.status(501).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete role',
      });
    }
  });
}
