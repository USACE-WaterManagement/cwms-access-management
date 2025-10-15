import type { FastifyInstance } from 'fastify';

import { generateToken } from '../middleware/auth.middleware.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body as {
        username: string;
        password: string;
      };

      const adminUsername = process.env.KEYCLOAK_ADMIN_USER || 'admin';
      const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

      if (username === adminUsername && password === adminPassword) {
        const token = generateToken(username);

        return reply.send({
          success: true,
          data: {
            token,
            username,
          },
        });
      } else {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }
    } catch (error) {
      fastify.log.error({ error }, 'Login failed');

      return reply.status(500).send({
        success: false,
        error: 'Login failed',
      });
    }
  });
}
