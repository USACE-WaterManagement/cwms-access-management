import type { FastifyRequest, FastifyReply } from 'fastify';

import { KeycloakAuthService } from '../services/keycloak-auth.service.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080/auth';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'cwms';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cwms';

const keycloakAuthService = new KeycloakAuthService(KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID);

export interface AuthUser {
  sub: string;
  username: string;
  email?: string;
  roles: string[];
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await keycloakAuthService.validateToken(token);

      (request as any).user = {
        sub: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
      } as AuthUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token validation failed';
      return reply.status(401).send({
        success: false,
        error: message,
      });
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Authentication failed',
    });
  }
}

export function getKeycloakAuthService(): KeycloakAuthService {
  return keycloakAuthService;
}
