import type { FastifyInstance } from 'fastify';

import { getKeycloakAuthService } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

export async function authRoutes(fastify: FastifyInstance) {
  const keycloakAuth = getKeycloakAuthService();

  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body as {
        username: string;
        password: string;
      };

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username and password are required',
        });
      }

      const tokenResponse = await keycloakAuth.login(username, password);

      return reply.send({
        success: true,
        data: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_in: tokenResponse.expires_in,
          token_type: tokenResponse.token_type,
          username,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      logger.error({ error }, 'Login failed');

      if (message === 'Invalid credentials') {
        return reply.status(401).send({
          success: false,
          error: message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    try {
      const { refresh_token } = request.body as { refresh_token: string };

      if (!refresh_token) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
        });
      }

      await keycloakAuth.logout(refresh_token);

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Logout failed');

      return reply.status(500).send({
        success: false,
        error: 'Logout failed',
      });
    }
  });

  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refresh_token } = request.body as { refresh_token: string };

      if (!refresh_token) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const tokenResponse = await keycloakAuth.refreshToken(refresh_token);

      return reply.send({
        success: true,
        data: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_in: tokenResponse.expires_in,
          token_type: tokenResponse.token_type,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Token refresh failed');

      return reply.status(401).send({
        success: false,
        error: 'Token refresh failed',
      });
    }
  });
}
