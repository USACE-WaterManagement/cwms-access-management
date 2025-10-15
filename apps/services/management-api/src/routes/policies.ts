import type { FastifyInstance } from 'fastify';

import type { OpaService } from '../services/opa.service.js';
import { logger } from '../utils/logger.js';

export async function policiesRoutes(
  fastify: FastifyInstance,
  opaService: OpaService,
) {
  fastify.get('/policies', async (request, reply) => {
    try {
      const policies = await opaService.getPolicies();

      return reply.send({
        success: true,
        data: policies,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get policies');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch policies',
      });
    }
  });

  fastify.get('/policies/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const policy = await opaService.getPolicy(id);

      if (!policy) {
        return reply.status(404).send({
          success: false,
          error: 'Policy not found',
        });
      }

      return reply.send({
        success: true,
        data: policy,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get policy');

      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch policy',
      });
    }
  });
}
